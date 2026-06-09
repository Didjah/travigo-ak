import { supabase } from './supabase';

export interface AbonnementScolaire {
  id: string;
  parent_id: string;
  chauffeur_id: string | null;
  enfant_prenom: string;
  ecole: string;
  heure_matin: string;
  heure_soir: string;
  montant_fcfa: number;
  statut: 'actif' | 'expire' | 'suspendu' | 'en_attente';
  created_at: string;
}

export const MONTANT_SCOLAIRE = 15000;

export async function creerAbonnementScolaire(
  parentId: string,
  enfantPrenom: string,
  ecole: string,
  heureMatin: string,
  heureSoir: string
): Promise<AbonnementScolaire | null> {
  const { data, error } = await supabase
    .from('abonnements_scolaires')
    .insert({
      parent_id: parentId,
      enfant_prenom: enfantPrenom,
      ecole,
      heure_matin: heureMatin,
      heure_soir: heureSoir,
      montant_fcfa: MONTANT_SCOLAIRE,
      statut: 'en_attente',
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as AbonnementScolaire;
}

export async function getAbonnementsScolaireParent(
  parentId: string
): Promise<AbonnementScolaire[]> {
  const { data } = await supabase
    .from('abonnements_scolaires')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false });

  return (data as AbonnementScolaire[]) ?? [];
}

export async function getAbonnementsScolaireChauffeur(
  chauffeurId: string
): Promise<AbonnementScolaire[]> {
  const { data } = await supabase
    .from('abonnements_scolaires')
    .select('*')
    .eq('chauffeur_id', chauffeurId)
    .eq('statut', 'actif')
    .order('heure_matin', { ascending: true });

  return (data as AbonnementScolaire[]) ?? [];
}

export async function prendreEnChargeScolaire(
  abonnementId: string,
  chauffeurId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('abonnements_scolaires')
    .update({ chauffeur_id: chauffeurId, statut: 'actif' })
    .eq('id', abonnementId);

  return !error;
}

export async function getAbonnementsEnAttente(): Promise<AbonnementScolaire[]> {
  const { data } = await supabase
    .from('abonnements_scolaires')
    .select('*')
    .eq('statut', 'en_attente')
    .is('chauffeur_id', null)
    .order('created_at', { ascending: true });

  return (data as AbonnementScolaire[]) ?? [];
}

export function formatHeure(heure: string): string {
  // s'assure que HH:MM est bien formé
  const clean = heure.replace(/[^0-9:]/g, '');
  if (clean.length >= 4 && !clean.includes(':')) {
    return `${clean.slice(0, 2)}:${clean.slice(2, 4)}`;
  }
  return clean;
}
