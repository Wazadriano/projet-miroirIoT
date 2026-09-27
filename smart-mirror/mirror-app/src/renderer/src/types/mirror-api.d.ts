import type * as Contract from '../../../shared/mirror-api'

declare global {
  interface Window {
    mirrorApi: Contract.MirrorApi
  }

  type MirrorApi = Contract.MirrorApi
  type DisplayConfig = Contract.DisplayConfig
  type WifiNetwork = Contract.WifiNetwork
  type WifiStatus = Contract.WifiStatus
  type ProvisionData = Contract.ProvisionData
  type ProvisionResult = Contract.ProvisionResult
  type Cliente = Contract.Cliente
  type CreateClienteData = Contract.CreateClienteData
  type Consentement = Contract.Consentement
  type Seance = Contract.Seance
  type MicroscopeDevice = Contract.MicroscopeDevice
  type MicroscopeStatus = Contract.MicroscopeStatus
  type DiagnosticCategory = Contract.DiagnosticCategory
  type Diagnostic = Contract.Diagnostic
  type AnalysisResult = Contract.AnalysisResult
  type PlaylistItem = Contract.PlaylistItem
  type PlaylistResponse = Contract.PlaylistResponse
}

export {}
