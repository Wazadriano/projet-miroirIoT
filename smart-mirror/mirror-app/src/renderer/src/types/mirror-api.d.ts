declare global {
  interface Window {
    mirrorApi: MirrorApi
  }

  interface MirrorApi {
    isProvisioned(): Promise<boolean>
    getDisplayConfig(): Promise<DisplayConfig>
    getConfig(): Promise<unknown>
    getBoutiqueId(): Promise<string>

    getWifiNetworks(): Promise<WifiNetwork[]>
    provision(data: ProvisionData): Promise<ProvisionResult>

    searchClientes(query: string): Promise<Cliente[]>
    createCliente(data: CreateClienteData): Promise<Cliente>

    createConsentement(data: { clienteId: string; texteConsent: string }): Promise<Consentement>

    startSeance(data: { clienteId: string; consentementId: string }): Promise<Seance>
    endSeance(seanceId: string): Promise<Seance>

    savePhoto(data: { imageBase64: string; seanceId: string; phase: 'avant' | 'apres' }): Promise<{ localPath: string; photoId: string }>
    analyzePhoto(data: { imageBase64: string; photoId: string }): Promise<AnalysisResult>

    getMicroscopeDevice(): Promise<MicroscopeDevice | null>
    onMicroscopeStatus(callback: (status: MicroscopeStatus) => void): void

    loadFullResPhoto(localPath: string): Promise<{ success: boolean; imageBase64?: string; error?: string }>

    getPlaylist(): Promise<PlaylistResponse>

    getWifiStatus(): Promise<WifiStatus>
    onWifiStatusChanged(callback: (status: { connected: boolean; ssid?: string }) => void): void
    getSyncQueueSize(): Promise<number>
    fetchMirrorConfig(): Promise<unknown>
    updateSeanceNotes(data: { seanceId: string; noteSeance: string }): Promise<unknown>
  }

  interface DisplayConfig {
    animatedBgEnabled: boolean
    animatedBgTheme: string
    volume: number
    mediaMode: 'fullscreen' | 'side_panel' | 'hidden'
    couleurPrimaire: string
    couleurSecondaire: string
    police: string
    logoUrl: string
  }

  interface WifiNetwork {
    ssid: string
    signal: number
    security: string
  }

  interface WifiStatus {
    connected: boolean
    ssid: string
    signal: number
    ip: string
  }

  interface ProvisionData {
    ssid: string
    password: string
    boutiqueId: string
    apiBaseUrl: string
  }

  interface ProvisionResult {
    success: boolean
    error?: string
    mirror?: { id: string; nom: string; boutique_id: string }
  }

  interface Cliente {
    id: string
    prenom: string
    nom: string
    email: string | null
    telephone: string | null
    date_de_naissance: string | null
    sexe: string | null
  }

  interface CreateClienteData {
    prenom: string
    nom: string
    email?: string
    telephone?: string
    date_de_naissance?: string
    sexe?: string
  }

  interface Consentement {
    id: string
    cliente_id: string
    texte_consent: string
    date_consentement: string
  }

  interface Seance {
    id: string
    cliente_id: string
    miroir_id: string
    consentement_id: string
    date_debut: string
    date_fin: string | null
  }

  interface MicroscopeDevice {
    path: string
    name: string
    isUvc: boolean
  }

  interface MicroscopeStatus {
    connected: boolean
    device: MicroscopeDevice | null
  }

  interface DiagnosticCategory {
    nom: string
    score: number
    niveau: string
  }

  interface Diagnostic {
    categories: DiagnosticCategory[]
    score_global: number
    commentaire: string
    produits_recommandes: string[]
    modele: string
    confiance: number
  }

  interface AnalysisResult {
    success: boolean
    diagnostic?: Diagnostic
    latence?: number
    error?: string
  }

  interface PlaylistItem {
    id: string
    type: string
    nom_fichier: string
    src: string
  }

  interface PlaylistResponse {
    playlist: PlaylistItem[]
    produits: unknown[]
    config: unknown
  }
}

export {}
