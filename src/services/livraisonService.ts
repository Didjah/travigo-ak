import { supabase } from './supabase';

export type TypeLivraison = 'colis' | 'medicament' | 'autre';
export type StatutLivraison =
  | 'en_attente'
  | 'acceptee'
  | 'collecte'
  | 'en_route'
  | 'livree'
  | 'annulee';

export interface Livraison {
  id: string;
  expediteur_id: string;
  livreur_id: string | null;
  description_colis: string;
  adresse_collecte: string;
  adresse_livraison: string;
  type: TypeLivraison;
  prix_fcfa: number;
  statut: StatutLivraison;
  created_at: string;
}

export const TYPES_LIVRAISON: Record<
  TypeLivraison,
  { label: string; emoji: string; prix: number; description: string }
> = {
  colis: {
    label: 'Colis',
    emoji: '📦',
    prix: 1000,
    description: 'Envoi de paquet, vêtements, objets divers',
  },
  medicament: {
    label: 'Médicaments',
    emoji: '💊',
    prix: 800,
    description: 'Livraison urgente de médicaments en pharmacie',
  },
  autre: {
    label: 'Documents',
    emoji: '📄',
    prix: 700,
    description: 'Courrier, dossiers administratifs, contrats',
  },
};

export const STATUTS: Record<
  StatutLivraison,
  { label: string; bg: string; color: string }
> = {
  en_attente: { label: 'En attente',  bg: '#F3F4F6', color: '#6B7280' },
  acceptee:   { label: 'Acceptée',    bg: '#E3F2FD', color: '#1565C0' },
  collecte:   { label: 'Collecté',    bg: '#FFF3E0', color: '#E65100' },
  en_route:   { label: 'En route',    bg: '#FEF9C3', color: '#854D0E' },
  livree:     { label: 'Livré ✓',     bg: '#E8F5E9', color: '#2E7D32' },
  annulee:    { label: 'Annulée',     bg: '#FFEBEE', color: '#C62828' },
};

export async function creerLivraison(
  expediteurId: string,
  type: TypeLivraison,
  description: string,
  adresseCollecte: string,
  adresseLivraison: string
): Promise<Livraison | null> {
  const prix = TYPES_LIVRAISON[type].prix;
  const { data, error } = await supabase
    .from('livraisons')
    .insert({
      expediteur_id: expediteurId,
      type,
      description_colis: description,
      adresse_collecte: adresseCollecte,
      adresse_livraison: adresseLivraison,
      prix_fcfa: prix,
      statut: 'en_attente',
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as Livraison;
}

export async function getLivraisonsExpediteur(
  expediteurId: string
): Promise<Livraison[]> {
  const { data } = await supabase
    .from('livraisons')
    .select('*')
    .eq('expediteur_id', expediteurId)
    .order('created_at', { ascending: false });

  return (data as Livraison[]) ?? [];
}

export async function getLivraisonsDisponibles(): Promise<Livraison[]> {
  const { data } = await supabase
    .from('livraisons')
    .select('*')
    .eq('statut', 'en_attente')
    .is('livreur_id', null)
    .order('created_at', { ascending: true });

  return (data as Livraison[]) ?? [];
}

export async function getLivraisonsLivreur(
  livreurId: string
): Promise<Livraison[]> {
  const { data } = await supabase
    .from('livraisons')
    .select('*')
    .eq('livreur_id', livreurId)
    .not('statut', 'in', '("livree","annulee")')
    .order('created_at', { ascending: false });

  return (data as Livraison[]) ?? [];
}

export async function accepterLivraison(
  livraisonId: string,
  livreurId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('livraisons')
    .update({ livreur_id: livreurId, statut: 'acceptee' })
    .eq('id', livraisonId)
    .eq('statut', 'en_attente');

  return !error;
}

export async function avancerStatut(
  livraisonId: string,
  nouveauStatut: StatutLivraison
): Promise<boolean> {
  const { error } = await supabase
    .from('livraisons')
    .update({ statut: nouveauStatut })
    .eq('id', livraisonId);

  return !error;
}

export function prochainStatut(
  statut: StatutLivraison
): { statut: StatutLivraison; label: string } | null {
  const map: Partial<Record<StatutLivraison, { statut: StatutLivraison; label: string }>> = {
    acceptee: { statut: 'collecte',  label: 'Confirmer la collecte' },
    collecte: { statut: 'en_route',  label: 'Marquer en route' },
    en_route: { statut: 'livree',    label: 'Livraison effectuée ✓' },
  };
  return map[statut] ?? null;
}
