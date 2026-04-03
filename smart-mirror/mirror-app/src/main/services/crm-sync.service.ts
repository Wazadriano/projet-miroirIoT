import { readFileSync } from 'fs'
import { basename } from 'path'
import { ConfigService } from './config.service'
import { ApiClientService } from './api-client.service'

interface SyncTableReport {
  synced: number
  failed: number
}

export interface SyncReport {
  clientes: SyncTableReport
  consentements: SyncTableReport
  seances: SyncTableReport
  photos: SyncTableReport
  errors: string[]
}

export class CrmSyncService {
  private online = false
  private lastSyncTime: string | null = null
  private syncing = false

  constructor(
    private config: ConfigService,
    private localApi: ApiClientService
  ) {}

  private get crmUrl(): string {
    return this.config.getCrmBaseUrl()
  }

  private get crmHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.getDeviceToken()}`
    }
  }

  // --- Online detection ---

  async checkOnline(): Promise<boolean> {
    if (!this.crmUrl) {
      this.online = false
      return false
    }
    try {
      const response = await fetch(`${this.crmUrl}/miroir/heartbeat`, {
        method: 'POST',
        headers: this.crmHeaders,
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(5000)
      })
      this.online = response.ok
    } catch {
      this.online = false
    }
    return this.online
  }

  isOnline(): boolean {
    return this.online
  }

  getLastSyncTime(): string | null {
    return this.lastSyncTime
  }

  // --- CRM client search (cross-mirror) ---

  async searchClientesCrm(query: string): Promise<unknown[]> {
    if (!this.crmUrl) return []
    const response = await fetch(
      `${this.crmUrl}/miroir/clientes?search=${encodeURIComponent(query)}`,
      { headers: this.crmHeaders, signal: AbortSignal.timeout(5000) }
    )
    if (!response.ok) return []
    const result = await response.json()
    return result.data || []
  }

  // --- Sync pipeline ---

  async syncAll(): Promise<SyncReport> {
    if (this.syncing || !this.crmUrl) {
      return { clientes: { synced: 0, failed: 0 }, consentements: { synced: 0, failed: 0 }, seances: { synced: 0, failed: 0 }, photos: { synced: 0, failed: 0 }, errors: [] }
    }

    this.syncing = true
    const report: SyncReport = {
      clientes: { synced: 0, failed: 0 },
      consentements: { synced: 0, failed: 0 },
      seances: { synced: 0, failed: 0 },
      photos: { synced: 0, failed: 0 },
      errors: []
    }

    try {
      const pending = await this.localApi.getSyncPending()

      // Sync clients first (seances depend on them)
      await this.syncTable(pending.clientes, 'clientes', report, async (client: Record<string, unknown>) => {
        return this.pushTocrm('/miroir/clientes', {
          prenom: client.prenom,
          nom: client.nom,
          email: client.email,
          telephone: client.telephone,
          date_de_naissance: client.date_de_naissance,
          sexe: client.sexe
        })
      })

      // Sync consents
      await this.syncTable(pending.consentements, 'consentements', report, async (consent: Record<string, unknown>) => {
        return this.pushTocrm('/miroir/consentements', {
          cliente_id: consent.cliente_id,
          texte_consent: consent.texte_consent
        })
      })

      // Sync seances
      await this.syncTable(pending.seances, 'seances', report, async (seance: Record<string, unknown>) => {
        const result = await this.pushTocrm('/miroir/seances', {
          cliente_id: seance.cliente_id,
          consentement_id: seance.consentement_id
        })
        // If seance is ended, also close it on CRM
        if (result && seance.date_fin) {
          await this.pushTocrm(`/miroir/seances/${seance.id}/fin`, {})
        }
        // If there are notes, send them
        if (result && seance.note_seance) {
          await fetch(`${this.crmUrl}/miroir/seances/${seance.id}`, {
            method: 'PATCH',
            headers: this.crmHeaders,
            body: JSON.stringify({ note_seance: seance.note_seance })
          }).catch(() => {})
        }
        return result
      })

      // Sync photos (multipart with actual file)
      for (const photo of pending.photos as Array<Record<string, unknown>>) {
        try {
          await this.pushPhotoCrm(photo)
          report.photos.synced++
          await this.localApi.confirmSynced('photos', [photo.id as string])
        } catch (err) {
          report.photos.failed++
          report.errors.push(`photo ${photo.id}: ${err instanceof Error ? err.message : 'unknown'}`)
        }
      }

      this.lastSyncTime = new Date().toISOString()
    } catch (err) {
      report.errors.push(`sync pipeline: ${err instanceof Error ? err.message : 'unknown'}`)
    } finally {
      this.syncing = false
    }

    return report
  }

  private async syncTable(
    records: unknown[],
    table: string,
    report: SyncReport,
    pushFn: (record: Record<string, unknown>) => Promise<boolean>
  ): Promise<void> {
    const tableReport = report[table as keyof SyncReport] as SyncTableReport
    const confirmedIds: string[] = []

    for (const record of records as Array<Record<string, unknown>>) {
      try {
        const ok = await pushFn(record)
        if (ok) {
          tableReport.synced++
          confirmedIds.push(record.id as string)
        } else {
          tableReport.failed++
        }
      } catch (err) {
        tableReport.failed++
        report.errors.push(`${table} ${record.id}: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    }

    if (confirmedIds.length > 0) {
      await this.localApi.confirmSynced(table, confirmedIds)
    }
  }

  private async pushTocrm(path: string, data: unknown): Promise<boolean> {
    const response = await fetch(`${this.crmUrl}${path}`, {
      method: 'POST',
      headers: this.crmHeaders,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000)
    })
    return response.ok || response.status === 200 || response.status === 201
  }

  private async pushPhotoCrm(photo: Record<string, unknown>): Promise<void> {
    const localPath = photo.chemin_local as string
    if (!localPath) return

    let fileBuffer: Buffer
    try {
      fileBuffer = readFileSync(localPath)
    } catch {
      // File already cleaned up locally, mark as synced anyway
      return
    }

    const formData = new FormData()
    formData.append('image', new Blob([fileBuffer], { type: 'image/jpeg' }), basename(localPath))
    formData.append('seance_id', photo.seance_id as string)
    formData.append('phase', photo.phase as string)
    formData.append('zone', 'cuir_chevelu')

    if (photo.diagnostic_ia) {
      formData.append('diagnostic_ia', JSON.stringify(photo.diagnostic_ia))
    }
    if (photo.modele_ia) {
      formData.append('modele_ia', photo.modele_ia as string)
    }
    if (photo.latence_ms) {
      formData.append('latence_ms', String(photo.latence_ms))
    }

    const response = await fetch(`${this.crmUrl}/miroir/photos`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.config.getDeviceToken()}` },
      body: formData,
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) {
      throw new Error(`CRM photo upload failed: HTTP ${response.status}`)
    }
  }

  // --- Cleanup ---

  async cleanupSynced(): Promise<void> {
    await this.localApi.cleanupSynced()
  }
}
