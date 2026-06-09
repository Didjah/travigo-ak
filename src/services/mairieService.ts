import { supabase } from './supabase';

export const COMMISSION_MAIRIE_TAUX = 0.02; // 2 % du CA total plateforme
export const CODE_ACCES_DEV = 'MAIRIE2025';

export type TypeAbonnementInfo = 'taxi' | 'tricycle' | 'premium' | null;

export interface RapportMairie {
  id: string;
  periode: string;
  total_courses: number;
  total_chauffeurs: number;
  total_revenus_fcfa: number;
  commission_mairie_fcfa: number;
  created_at: string;
}

export interface StatsDashboardMairie {
  totalChauffeurs: number;
  chauffeursActifs: number;
  coursesduMois: number;
  revenusMois: number;
  commissionMairie: number;
  revenusSemaines: number[]; // 4 dernières semaines
  periodeLabel: string;
}

export interface ChauffeurMairie {
  id: string;
  prenom: string;
  telephone: string;
  abonnement: TypeAbonnementInfo;
  abonnementStatut: 'actif' | 'expire' | 'aucun';
  coursesTotal: number;
}

// ── Authentification ──────────────────────────────────────────────────────────

export async function verifierCodeAcces(code: string): Promise<boolean> {
  if (__DEV__) return code.trim().toUpperCase() === CODE_ACCES_DEV;
  const { data } = await supabase
    .from('utilisateurs')
    .select('id')
    .eq('role', 'admin_mairie')
    .eq('telephone', code.trim())
    .maybeSingle();
  return !!data;
}

// ── Stats dashboard ──────────────────────────────────────────────────────────

function periodeMoisEnCours(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function debutMoisISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export async function getStatsDashboard(): Promise<StatsDashboardMairie> {
  const debutMois = debutMoisISO();
  const periode = periodeMoisEnCours();

  const [
    { count: totalChauffeurs },
    { count: chauffeursActifs },
    { data: coursesMois },
  ] = await Promise.all([
    supabase
      .from('utilisateurs')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'chauffeur'),
    supabase
      .from('abonnements')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'actif')
      .gte('date_fin', new Date().toISOString().split('T')[0]),
    supabase
      .from('courses')
      .select('prix')
      .gte('created_at', debutMois),
  ]);

  const revenusMois = (coursesMois || []).reduce(
    (s, c) => s + (c.prix ?? 0),
    0
  );
  const commissionMairie = Math.round(revenusMois * COMMISSION_MAIRIE_TAUX);

  // Revenus par semaine : approximation avec 4 tranches de 7 jours
  const revenusSemaines = [0, 0, 0, 0];
  (coursesMois || []).forEach((c) => {
    const jour = new Date(c.created_at ?? '').getDate();
    const idx = Math.min(3, Math.floor((jour - 1) / 7));
    revenusSemaines[idx] += c.prix ?? 0;
  });

  return {
    totalChauffeurs: totalChauffeurs ?? 0,
    chauffeursActifs: chauffeursActifs ?? 0,
    coursesduMois: (coursesMois || []).length,
    revenusMois,
    commissionMairie,
    revenusSemaines,
    periodeLabel: periode,
  };
}

// ── Liste chauffeurs ──────────────────────────────────────────────────────────

export async function getChauffeursMairie(): Promise<ChauffeurMairie[]> {
  const { data: chauffeurs } = await supabase
    .from('utilisateurs')
    .select('id, prenom, telephone')
    .eq('role', 'chauffeur')
    .order('prenom', { ascending: true });

  if (!chauffeurs || chauffeurs.length === 0) return [];

  const ids = chauffeurs.map((c) => c.id);

  const [{ data: abos }, { data: courses }] = await Promise.all([
    supabase
      .from('abonnements')
      .select('chauffeur_id, type, statut, date_fin')
      .in('chauffeur_id', ids)
      .order('created_at', { ascending: false }),
    supabase
      .from('courses')
      .select('chauffeur_id')
      .in('chauffeur_id', ids),
  ]);

  const aboMap: Record<string, { type: TypeAbonnementInfo; statut: 'actif' | 'expire' | 'aucun' }> = {};
  (abos || []).forEach((a) => {
    if (!aboMap[a.chauffeur_id]) {
      const expire = a.statut !== 'actif' || new Date(a.date_fin) < new Date();
      aboMap[a.chauffeur_id] = {
        type: a.type as TypeAbonnementInfo,
        statut: expire ? 'expire' : 'actif',
      };
    }
  });

  const coursesMap: Record<string, number> = {};
  (courses || []).forEach((c) => {
    coursesMap[c.chauffeur_id] = (coursesMap[c.chauffeur_id] ?? 0) + 1;
  });

  return chauffeurs.map((c) => ({
    id: c.id,
    prenom: c.prenom,
    telephone: c.telephone,
    abonnement: aboMap[c.id]?.type ?? null,
    abonnementStatut: aboMap[c.id]?.statut ?? 'aucun',
    coursesTotal: coursesMap[c.id] ?? 0,
  }));
}

// ── Rapports ──────────────────────────────────────────────────────────────────

export async function sauvegarderRapport(
  stats: StatsDashboardMairie
): Promise<RapportMairie | null> {
  const { data, error } = await supabase
    .from('rapports_mairie')
    .insert({
      periode: stats.periodeLabel,
      total_courses: stats.coursesduMois,
      total_chauffeurs: stats.totalChauffeurs,
      total_revenus_fcfa: stats.revenusMois,
      commission_mairie_fcfa: stats.commissionMairie,
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as RapportMairie;
}

export async function getRapports(): Promise<RapportMairie[]> {
  const { data } = await supabase
    .from('rapports_mairie')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(12);
  return (data as RapportMairie[]) ?? [];
}
