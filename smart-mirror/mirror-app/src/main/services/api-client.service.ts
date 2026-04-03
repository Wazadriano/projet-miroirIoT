import { ConfigService } from './config.service'

interface ApiResponse<T> {
  data: T
  error?: string
}

export class ApiClientService {
  constructor(private config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.getApiBaseUrl()
  }

  private get iaUrl(): string {
    return this.config.getIaProxyUrl()
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.getDeviceToken()}`
    }
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(url, {
      ...options,
      headers: { ...this.headers, ...options.headers }
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || body.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // --- Auth ---

  async registerDevice(boutiqueId: string): Promise<{ token: string; mirror: { id: string; nom: string; boutique_id: string } }> {
    const res = await this.request<{ token: string; mirror: { id: string; nom: string; boutique_id: string } }>(
      `${this.baseUrl}/auth/mirror/register`,
      {
        method: 'POST',
        body: JSON.stringify({ boutique_id: boutiqueId })
      }
    )
    return res.data
  }

  // --- Clientes ---

  async searchClientes(query: string): Promise<unknown[]> {
    const boutiqueId = this.config.getBoutiqueId()
    const res = await this.request<unknown[]>(
      `${this.baseUrl}/clientes?boutique_id=${boutiqueId}&q=${encodeURIComponent(query)}`
    )
    return res.data
  }

  async createCliente(data: {
    prenom: string; nom: string; email?: string; telephone?: string; date_de_naissance?: string; sexe?: string
  }): Promise<unknown> {
    const res = await this.request<unknown>(`${this.baseUrl}/clientes`, {
      method: 'POST',
      body: JSON.stringify({ ...data, boutique_id: this.config.getBoutiqueId() })
    })
    return res.data
  }

  // --- Consentements ---

  async checkValidConsent(clienteId: string): Promise<{ valid: boolean; consent?: unknown }> {
    const res = await this.request<{ valid: boolean; consent?: unknown }>(
      `${this.baseUrl}/clientes/${clienteId}/consent-valid`
    )
    return res.data
  }

  async createConsentement(clienteId: string, texteConsent: string): Promise<unknown> {
    const res = await this.request<unknown>(`${this.baseUrl}/consentements`, {
      method: 'POST',
      body: JSON.stringify({
        boutique_id: this.config.getBoutiqueId(),
        cliente_id: clienteId,
        texte_consent: texteConsent
      })
    })
    return res.data
  }

  // --- Seances ---

  async createSeance(clienteId: string, consentementId: string): Promise<unknown> {
    const res = await this.request<unknown>(`${this.baseUrl}/seances`, {
      method: 'POST',
      body: JSON.stringify({
        boutique_id: this.config.getBoutiqueId(),
        miroir_id: this.config.getDeviceId(),
        cliente_id: clienteId,
        consentement_id: consentementId
      })
    })
    return res.data
  }

  async endSeance(seanceId: string): Promise<unknown> {
    const res = await this.request<unknown>(`${this.baseUrl}/seances/${seanceId}/end`, {
      method: 'POST'
    })
    return res.data
  }

  async updateSeance(seanceId: string, data: { note_seance?: string; bilan_ia?: unknown }): Promise<unknown> {
    const res = await this.request<unknown>(`${this.baseUrl}/seances/${seanceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    return res.data
  }

  // --- Photos ---

  async uploadPhotoMetadata(data: {
    seanceId: string; cheminLocal: string; phase: 'avant' | 'apres'
  }): Promise<{ id: string }> {
    const res = await this.request<{ id: string }>(`${this.baseUrl}/photos`, {
      method: 'POST',
      body: JSON.stringify({
        seance_id: data.seanceId,
        boutique_id: this.config.getBoutiqueId(),
        chemin_local: data.cheminLocal,
        phase: data.phase
      })
    })
    return res.data
  }

  async updatePhotoDiagnostic(photoId: string, diagnostic: unknown): Promise<void> {
    await this.request(`${this.baseUrl}/photos/${photoId}`, {
      method: 'PATCH',
      body: JSON.stringify(diagnostic)
    })
  }

  // --- IA Analysis ---

  async analyzePhoto(imageBase64: string): Promise<{
    categories: Array<{ nom: string; score: number; niveau: string }>
    score_global: number
    commentaire: string
    produits_recommandes: string[]
    modele: string
    confiance: number
  }> {
    const token = this.config.getDeviceToken()
    const response = await fetch(`${this.iaUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mirror-Token': token
      },
      body: JSON.stringify({ image: imageBase64 })
    })

    if (!response.ok) {
      throw new Error(`IA analysis failed: HTTP ${response.status}`)
    }

    const result = await response.json()
    return result.data
  }

  // --- Report / QR ---

  async generateReport(seanceId: string): Promise<unknown> {
    const res = await this.request<unknown>(`${this.baseUrl}/seances/${seanceId}/report`, { method: 'POST' })
    return res.data
  }

  async getQRCode(seanceId: string): Promise<unknown> {
    const res = await this.request<unknown>(`${this.baseUrl}/seances/${seanceId}/qrcode`)
    return res.data
  }

  // --- Config ---

  async fetchAndUpdateConfig(mirrorId: string): Promise<unknown> {
    const res = await this.request<unknown>(`${this.baseUrl}/miroirs/${mirrorId}/config`)
    return res.data
  }

  // --- Sync (read local pending records) ---

  async getSyncPending(): Promise<{
    clientes: unknown[]; consentements: unknown[]; seances: unknown[]; photos: unknown[]
  }> {
    const res = await this.request<{
      clientes: unknown[]; consentements: unknown[]; seances: unknown[]; photos: unknown[]
    }>(`${this.baseUrl}/sync/pending`)
    return res.data
  }

  async confirmSynced(table: string, ids: string[]): Promise<void> {
    await this.request(`${this.baseUrl}/sync/confirm`, {
      method: 'PATCH',
      body: JSON.stringify({ table, ids })
    })
  }

  async cleanupSynced(): Promise<void> {
    await this.request(`${this.baseUrl}/sync/cleanup`, { method: 'DELETE' })
  }

  // --- Heartbeat ---

  async sendHeartbeat(): Promise<void> {
    const deviceId = this.config.getDeviceId()
    if (!deviceId) return
    await this.request(`${this.baseUrl}/miroirs/${deviceId}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify({ ip: '' })
    }).catch(() => {})
  }
}
