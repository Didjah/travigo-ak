export type UserRole = 'client' | 'chauffeur';

export interface User {
  id: string;
  nom: string;
  telephone: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Trajet {
  id: string;
  client_id: string;
  chauffeur_id?: string;
  depart: Coordonnees;
  destination: Coordonnees;
  statut: StatutTrajet;
  prix?: number;
  created_at: string;
}

export interface Coordonnees {
  latitude: number;
  longitude: number;
  adresse?: string;
}

export type StatutTrajet =
  | 'en_attente'
  | 'accepte'
  | 'en_cours'
  | 'termine'
  | 'annule';

export interface Vehicule {
  id: string;
  chauffeur_id: string;
  marque: string;
  modele: string;
  immatriculation: string;
  couleur: string;
}
