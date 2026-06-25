export interface User {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  role: "gerant" | "collaborateur";
}

export interface Boutique {
  id: string;
  nom: string;
  email_contact: string | null;
  shopify_domain: string | null;
  shopify_access_token: string | null;
  clientes_count?: number;
  miroirs_count?: number;
  seances_count?: number;
}

export interface Cliente {
  id: string;
  boutique_id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  date_de_naissance: string | null;
  sexe: "F" | "M" | "Non précisé" | null;
  note_praticien: string | null;
  shopify_customer_id: string | null;
  created_at: string;
  boutique?: { id: string; nom: string };
}

export interface Seance {
  id: string;
  boutique_id: string;
  miroir_id: string;
  cliente_id: string;
  consentement_id: string;
  date_debut: string;
  date_fin: string | null;
  note_seance: string | null;
  rapport_pdf_path: string | null;
  rapport_url: string | null;
  qr_scanne_at: string | null;
  email_envoye: boolean;
  cliente?: Cliente;
  miroir?: Miroir;
  boutique?: { id: string; nom: string };
  consentement?: Consentement;
  photos?: Photo[];
}

export interface Photo {
  id: string;
  seance_id: string;
  boutique_id: string;
  chemin_local: string | null;
  chemin_serveur: string | null;
  phase: "avant" | "apres";
  diagnostic_ia: Record<string, unknown> | null;
  modele_ia: string | null;
  latence_ms: number | null;
  synced: boolean;
  created_at: string;
}

export interface Miroir {
  id: string;
  boutique_id: string;
  nom: string;
  adresse_mac: string;
  token_device: string;
  en_ligne: boolean;
  derniere_activite: string | null;
  version_app: string | null;
  boutique?: { id: string; nom: string };
  created_at: string;
}

export interface ConfigMiroir {
  id: string;
  couleur_primaire: string;
  couleur_fond: string;
  typographie: string;
  fond_anime: boolean;
  theme_fond_anime: string | null;
  logo_url: string | null;
  volume: number;
}

export interface Consentement {
  id: string;
  boutique_id: string;
  cliente_id: string;
  texte_consent: string;
  date_consentement: string;
  date_revocation: string | null;
}

export interface Media {
  id: string;
  boutique_id: string;
  type: "video" | "image" | "youtube";
  chemin_fichier: string;
  url_youtube: string | null;
  nom_affichage: string;
  checksum: string | null;
  ordre_affichage: number;
  actif: boolean;
  created_at: string;
}

export interface Produit {
  id: string;
  boutique_id: string;
  shopify_id: string | null;
  nom: string;
  description: string | null;
  fournisseur: string | null;
  tags: string[];
  prix: number | null;
  url_produit: string | null;
  image_url: string | null;
  mis_en_avant: boolean;
  actif: boolean;
  boutique?: { id: string; nom: string };
  created_at: string;
}

export interface DashboardStats {
  age_distribution: { tranche: string; count: number }[];
  gender_distribution: { sexe: string; count: number }[];
  clients_per_boutique: { id: string; nom: string; count: number }[];
  total_clients: number;
  seances_today: number;
  seances_month: number;
  miroirs_total: number;
  miroirs_online: number;
  offline_miroirs: { id: string; nom: string; adresse_mac: string }[];
  weekly_seances: Record<string, number>;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
