// Contrat IPC entre le processus principal et l'interface.
// Le preload implemente `MirrorApi` (window.mirrorApi) ; l'interface le consomme.
// Toute evolution d'un canal se fait ici, et le typage des deux cotes suit.

export interface DisplayConfig {
  animatedBgEnabled: boolean
  animatedBgTheme: string
  volume: number
  mediaMode: 'fullscreen' | 'side_panel' | 'hidden'
  couleurPrimaire: string
  couleurSecondaire: string
  police: string
  logoUrl: string
}

export interface WifiNetwork {
  ssid: string
  signal: number
  security: string
}

export interface WifiStatus {
  connected: boolean
  ssid: string
  signal: number
  ip: string
}

export interface ProvisionData {
  ssid: string
  password: string
  boutiqueId: string
  apiBaseUrl: string
}

export interface ProvisionResult {
  success: boolean
  error?: string
  mirror?: { id: string; nom: string; boutique_id: string }
}

export interface Cliente {
  id: string
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
  date_de_naissance: string | null
  sexe: string | null
  created_at?: string
}

export interface CreateClienteData {
  prenom: string
  nom: string
  email?: string
  telephone?: string
  date_de_naissance?: string
  sexe?: string
}

export interface Consentement {
  id: string
  cliente_id: string
  texte_consent: string
  date_consentement: string
}

export interface Seance {
  id: string
  cliente_id: string
  miroir_id: string
  consentement_id: string
  date_debut: string
  date_fin: string | null
}

export interface MicroscopeDevice {
  connected: boolean
  streamUrl: string
  snapshotUrl: string
}

export interface MicroscopeStatus {
  connected: boolean
  streamUrl?: string | null
}

export interface DiagnosticCategory {
  nom: string
  score: number
  niveau: string
}

export interface Diagnostic {
  categories: DiagnosticCategory[]
  score_global: number
  commentaire: string
  produits_recommandes: string[]
  modele: string
  confiance: number
}

export interface AnalysisResult {
  success: boolean
  diagnostic?: Diagnostic
  latence?: number
  error?: string
}

export interface PlaylistItem {
  id: string
  type: string
  nom_fichier: string
  src: string
  ordre_affichage?: number
}

export interface PlaylistResponse {
  playlist: PlaylistItem[]
  produits: unknown[]
  config: unknown
}

export interface SavedPhoto {
  localPath: string
  photoId: string
}

export interface ImageResult {
  success: boolean
  imageBase64?: string
  error?: string
}

export interface QRCodeResult {
  qrcode: string
  reportUrl: string
}

export interface MirrorApi {
  // Config
  isProvisioned(): Promise<boolean>
  getDisplayConfig(): Promise<DisplayConfig>
  getConfig(): Promise<unknown>
  getBoutiqueId(): Promise<string>

  // Provisioning
  getWifiNetworks(): Promise<WifiNetwork[]>
  provision(data: ProvisionData): Promise<ProvisionResult>

  // Clientes
  searchClientes(query: string): Promise<Cliente[]>
  createCliente(data: CreateClienteData): Promise<Cliente>

  // Consentement
  checkValidConsent(clienteId: string): Promise<{ valid: boolean; consent?: Consentement }>
  createConsentement(data: { clienteId: string; texteConsent: string }): Promise<Consentement>

  // Seances
  startSeance(data: { clienteId: string; consentementId: string }): Promise<Seance>
  endSeance(seanceId: string): Promise<Seance>
  generateReport(seanceId: string): Promise<unknown>
  getQRCode(seanceId: string): Promise<QRCodeResult>
  updateSeanceNotes(data: { seanceId: string; noteSeance: string }): Promise<unknown>

  // Photos
  savePhoto(data: { imageBase64: string; seanceId: string; phase: 'avant' | 'apres' }): Promise<SavedPhoto>
  analyzePhoto(data: { imageBase64: string; photoId: string }): Promise<AnalysisResult>
  loadFullResPhoto(localPath: string): Promise<ImageResult>

  // Microscope
  getMicroscopeDevice(): Promise<MicroscopeDevice>
  connectMicroscope(ip?: string): Promise<{ success: boolean }>
  disconnectMicroscope(): Promise<{ success: boolean }>
  captureMicroscopeSnapshot(): Promise<ImageResult>
  onMicroscopeStatus(callback: (status: MicroscopeStatus) => void): () => void
  onMicroscopeButton(callback: () => void): () => void

  // WiFi
  getWifiStatus(): Promise<WifiStatus>
  onWifiStatusChanged(callback: (status: { connected: boolean; ssid?: string }) => void): void

  // Media playlist
  getPlaylist(): Promise<PlaylistResponse>

  // Sync
  getSyncQueueSize(): Promise<number>

  // Mirror config
  fetchMirrorConfig(): Promise<unknown>
}
