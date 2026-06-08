import * as Location from 'expo-location';
import { supabase } from './supabase';

let intervalId: ReturnType<typeof setInterval> | null = null;
let watchSubscription: Location.LocationSubscription | null = null;

export async function demanderPermissionBackground(): Promise<boolean> {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return false;
  return true;
}

/**
 * Démarre l'envoi de la position GPS du chauffeur vers Supabase toutes les 3 secondes.
 * Met à jour chauffeur_lat / chauffeur_lng dans la table "courses".
 */
export async function startTrackingChauffeur(courseId: string): Promise<void> {
  stopTracking();

  const granted = await demanderPermissionBackground();
  if (!granted) return;

  async function envoyerPosition() {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await supabase
        .from('courses')
        .update({
          chauffeur_lat: loc.coords.latitude,
          chauffeur_lng: loc.coords.longitude,
        })
        .eq('id', courseId);
    } catch {
      // position indisponible, on réessaie au prochain intervalle
    }
  }

  // Envoi immédiat puis toutes les 3 secondes
  envoyerPosition();
  intervalId = setInterval(envoyerPosition, 3000);
}

/**
 * Arrête l'envoi de la position.
 */
export function stopTracking(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (watchSubscription !== null) {
    watchSubscription.remove();
    watchSubscription = null;
  }
}

/**
 * Écoute en continu la position GPS locale (pour affichage sur la carte du dashboard).
 * Appelle le callback à chaque mise à jour.
 */
export async function watchPosition(
  callback: (lat: number, lng: number) => void
): Promise<() => void> {
  const granted = await demanderPermissionBackground();
  if (!granted) return () => {};

  const sub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 3000,
      distanceInterval: 10,
    },
    (loc) => {
      callback(loc.coords.latitude, loc.coords.longitude);
    }
  );

  return () => sub.remove();
}
