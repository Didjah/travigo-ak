import { supabase } from './supabase';

export type StatutTrajet = 'ouvert' | 'complet' | 'annule' | 'termine';
export type StatutReservation = 'confirmee' | 'annulee' | 'payee';

export interface TrajetCovoiturage {
  id: string;
  chauffeur_id: string;
  ville_depart: string;
  ville_arrivee: string;
  date_depart: string;      // YYYY-MM-DD
  heure_depart: string;     // HH:MM
  places_totales: number;
  places_disponibles: number;
  prix_par_place_fcfa: number;
  statut: StatutTrajet;
  created_at: string;
}

export interface ReservationCovoiturage {
  id: string;
  trajet_id: string;
  passager_id: string;
  places_reservees: number;
  montant_fcfa: number;
  statut: StatutReservation;
  created_at: string;
}

export const COMMISSION_TAUX = 0.10; // 10 %

// Villes desservies et distances depuis Gagnoa (km)
export const VILLES_DESTINATIONS: Record<string, { distance: number; prixSuggere: number }> = {
  Abidjan:      { distance: 265, prixSuggere: 4000 },
  Daloa:        { distance: 85,  prixSuggere: 1500 },
  'San Pedro':  { distance: 220, prixSuggere: 3500 },
  Yamoussoukro: { distance: 130, prixSuggere: 2500 },
  Divo:         { distance: 145, prixSuggere: 2500 },
  Soubré:       { distance: 90,  prixSuggere: 1500 },
  Sassandra:    { distance: 155, prixSuggere: 2500 },
  Issia:        { distance: 45,  prixSuggere: 800  },
  Bouaké:       { distance: 255, prixSuggere: 4000 },
  Autre:        { distance: 100, prixSuggere: 2000 },
};

export const VILLE_DEPART_DEFAUT = 'Gagnoa';

export const TRAJETS_POPULAIRES = ['Abidjan', 'Daloa', 'San Pedro', 'Yamoussoukro'];

export function calculerMontantPassager(
  prixParPlace: number,
  places: number
): { sousTotal: number; commission: number; total: number } {
  const sousTotal = prixParPlace * places;
  const commission = Math.round(sousTotal * COMMISSION_TAUX);
  return { sousTotal, commission, total: sousTotal + commission };
}

export function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
}

export function dateAujourdhui(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Trajets ────────────────────────────────────────────────────────────────

export async function getTrajetsDisponibles(
  villeArrivee?: string,
  dateDepart?: string
): Promise<TrajetCovoiturage[]> {
  let query = supabase
    .from('trajets_covoiturage')
    .select('*')
    .eq('statut', 'ouvert')
    .gte('date_depart', dateAujourdhui())
    .order('date_depart', { ascending: true })
    .order('heure_depart', { ascending: true });

  if (villeArrivee) query = query.ilike('ville_arrivee', `%${villeArrivee}%`);
  if (dateDepart)   query = query.eq('date_depart', dateDepart);

  const { data } = await query;
  return (data as TrajetCovoiturage[]) ?? [];
}

export async function getTrajetsChauffeur(
  chauffeurId: string
): Promise<TrajetCovoiturage[]> {
  const { data } = await supabase
    .from('trajets_covoiturage')
    .select('*')
    .eq('chauffeur_id', chauffeurId)
    .order('date_depart', { ascending: false });

  return (data as TrajetCovoiturage[]) ?? [];
}

export async function publierTrajet(
  chauffeurId: string,
  villeDepart: string,
  villeArrivee: string,
  dateDepart: string,
  heureDepart: string,
  placesTotales: number,
  prixParPlace: number
): Promise<TrajetCovoiturage | null> {
  const { data, error } = await supabase
    .from('trajets_covoiturage')
    .insert({
      chauffeur_id: chauffeurId,
      ville_depart: villeDepart,
      ville_arrivee: villeArrivee,
      date_depart: dateDepart,
      heure_depart: heureDepart,
      places_totales: placesTotales,
      places_disponibles: placesTotales,
      prix_par_place_fcfa: prixParPlace,
      statut: 'ouvert',
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as TrajetCovoiturage;
}

// ── Réservations ───────────────────────────────────────────────────────────

export async function reserverPlace(
  trajetId: string,
  passagerId: string,
  placesReservees: number,
  prixParPlace: number
): Promise<ReservationCovoiturage | null> {
  const { sousTotal } = calculerMontantPassager(prixParPlace, placesReservees);

  // Transaction : créer réservation + décrémenter places_disponibles
  const { data: resa, error: resaErr } = await supabase
    .from('reservations_covoiturage')
    .insert({
      trajet_id: trajetId,
      passager_id: passagerId,
      places_reservees: placesReservees,
      montant_fcfa: sousTotal,
      statut: 'confirmee',
    })
    .select()
    .single();

  if (resaErr || !resa) return null;

  // Décrémenter places et éventuellement fermer le trajet
  await supabase.rpc('decrementer_places_covoiturage', {
    p_trajet_id: trajetId,
    p_places: placesReservees,
  });

  return resa as ReservationCovoiturage;
}

export async function getReservationsPassager(
  passagerId: string
): Promise<ReservationCovoiturage[]> {
  const { data } = await supabase
    .from('reservations_covoiturage')
    .select('*')
    .eq('passager_id', passagerId)
    .order('created_at', { ascending: false });

  return (data as ReservationCovoiturage[]) ?? [];
}
