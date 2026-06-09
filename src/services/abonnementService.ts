import { supabase } from './supabase';

export type TypeAbonnement = 'taxi' | 'tricycle' | 'premium';
export type StatutAbonnement = 'actif' | 'expire' | 'suspendu';

export interface Abonnement {
  id: string;
  chauffeur_id: string;
  type: TypeAbonnement;
  montant_fcfa: number;
  statut: StatutAbonnement;
  date_debut: string;
  date_fin: string;
  created_at: string;
}

export const PLANS: Record<TypeAbonnement, { label: string; emoji: string; montant: number; avantages: string[] }> = {
  tricycle: {
    label: 'Tricycle',
    emoji: '🛺',
    montant: 3500,
    avantages: [
      'Accès aux courses tricycle',
      'Tableau de bord chauffeur',
      'Historique des courses',
      'Support basique',
    ],
  },
  taxi: {
    label: 'Standard Taxi',
    emoji: '🚕',
    montant: 7000,
    avantages: [
      'Accès prioritaire aux courses taxi',
      'Tableau de bord chauffeur',
      'Historique complet',
      'Statistiques mensuelles',
      'Support prioritaire',
    ],
  },
  premium: {
    label: 'Premium',
    emoji: '⭐',
    montant: 10000,
    avantages: [
      'Accès à toutes les courses',
      'Badge "Chauffeur Premium" visible',
      'Priorité maximale de dispatch',
      'Statistiques avancées',
      'Support 24/7 dédié',
      'Tarifs bonifiés sur les trajets',
    ],
  },
};

export async function getAbonnementActif(chauffeurId: string): Promise<Abonnement | null> {
  const { data } = await supabase
    .from('abonnements')
    .select('*')
    .eq('chauffeur_id', chauffeurId)
    .eq('statut', 'actif')
    .order('date_fin', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as Abonnement | null;
}

export async function getDernierAbonnement(chauffeurId: string): Promise<Abonnement | null> {
  const { data } = await supabase
    .from('abonnements')
    .select('*')
    .eq('chauffeur_id', chauffeurId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as Abonnement | null;
}

export async function creerAbonnement(
  chauffeurId: string,
  type: TypeAbonnement
): Promise<Abonnement | null> {
  const plan = PLANS[type];
  const dateDebut = new Date();
  const dateFin = new Date(dateDebut);
  dateFin.setMonth(dateFin.getMonth() + 1);

  // Expirer les anciens abonnements actifs
  await supabase
    .from('abonnements')
    .update({ statut: 'expire' })
    .eq('chauffeur_id', chauffeurId)
    .eq('statut', 'actif');

  const { data, error } = await supabase
    .from('abonnements')
    .insert({
      chauffeur_id: chauffeurId,
      type,
      montant_fcfa: plan.montant,
      statut: 'actif',
      date_debut: dateDebut.toISOString(),
      date_fin: dateFin.toISOString(),
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as Abonnement;
}

export function estExpire(abonnement: Abonnement): boolean {
  return new Date(abonnement.date_fin) < new Date();
}

export function joursRestants(abonnement: Abonnement): number {
  const diff = new Date(abonnement.date_fin).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
