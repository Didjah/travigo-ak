import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type CourseStatut =
  | 'en_attente'
  | 'acceptee'
  | 'en_cours'
  | 'terminee'
  | 'annulee';

export interface Course {
  id: string;
  passager_id: string | null;
  chauffeur_id: string | null;
  statut: CourseStatut;
  depart: string;
  destination: string;
  prix: number | null;
  chauffeur_lat: number | null;
  chauffeur_lng: number | null;
  created_at: string;
}

export interface PositionChauffeur {
  lat: number;
  lng: number;
}

/**
 * Crée une nouvelle course dans Supabase.
 * Retourne l'id de la course créée, ou null en cas d'erreur.
 */
export async function creerCourse(
  passagerId: string,
  depart: string,
  destination: string,
  prix: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      passager_id: passagerId,
      depart,
      destination,
      prix,
      statut: 'en_attente',
    })
    .select('id')
    .single();

  if (error || !data) return null;
  return data.id;
}

/**
 * Accepte une course : associe le chauffeur et passe le statut à "acceptee".
 */
export async function accepterCourse(
  courseId: string,
  chauffeurId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('courses')
    .update({ statut: 'acceptee', chauffeur_id: chauffeurId })
    .eq('id', courseId);

  return !error;
}

/**
 * Marque le chauffeur comme ayant pris en charge le passager → statut "en_cours".
 */
export async function demarrerCourse(courseId: string): Promise<boolean> {
  const { error } = await supabase
    .from('courses')
    .update({ statut: 'en_cours' })
    .eq('id', courseId);

  return !error;
}

/**
 * Termine la course → statut "terminee".
 */
export async function terminerCourse(courseId: string): Promise<boolean> {
  const { error } = await supabase
    .from('courses')
    .update({ statut: 'terminee' })
    .eq('id', courseId);

  return !error;
}

/**
 * Écoute en temps réel les changements de position du chauffeur via Supabase Realtime.
 * Appelle le callback dès que chauffeur_lat / chauffeur_lng changent.
 * Retourne une fonction de cleanup pour se désabonner.
 */
export function ecouterPositionChauffeur(
  courseId: string,
  callback: (position: PositionChauffeur) => void
): () => void {
  let channel: RealtimeChannel | null = null;

  channel = supabase
    .channel(`course-position-${courseId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'courses',
        filter: `id=eq.${courseId}`,
      },
      (payload) => {
        const record = payload.new as Course;
        if (
          record.chauffeur_lat !== null &&
          record.chauffeur_lng !== null
        ) {
          callback({
            lat: record.chauffeur_lat,
            lng: record.chauffeur_lng,
          });
        }
      }
    )
    .subscribe();

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Récupère une course par son id.
 */
export async function getCourse(courseId: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error || !data) return null;
  return data as Course;
}

/**
 * Récupère le prénom d'un utilisateur depuis la table utilisateurs.
 */
export async function getPrenomUtilisateur(userId: string): Promise<string> {
  const { data } = await supabase
    .from('utilisateurs')
    .select('prenom')
    .eq('id', userId)
    .single();
  return data?.prenom ?? 'Inconnu';
}

/**
 * Écoute le changement de statut d'une course (ex: passager attend qu'un chauffeur accepte).
 * Appelle le callback avec le record mis à jour dès qu'un UPDATE se produit.
 * Retourne une fonction de cleanup.
 */
export function ecouterStatutCourse(
  courseId: string,
  callback: (course: Course) => void
): () => void {
  const channel = supabase
    .channel(`course-statut-${courseId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'courses',
        filter: `id=eq.${courseId}`,
      },
      (payload) => {
        callback(payload.new as Course);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Écoute les nouvelles courses en_attente pour le tableau de bord chauffeur.
 * Appelle le callback pour chaque INSERT dont le statut est 'en_attente'.
 * Retourne une fonction de cleanup.
 */
export function ecouterNouvellesCourses(
  callback: (course: Course) => void
): () => void {
  const channel = supabase
    .channel('nouvelles-courses')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'courses',
      },
      (payload) => {
        const course = payload.new as Course;
        if (course.statut === 'en_attente') {
          callback(course);
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
