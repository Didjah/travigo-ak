import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Afficher les notifications quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Demande la permission push et retourne le token Expo.
 * Retourne null si refusé ou en cas d'erreur.
 */
export async function initialiserNotifications(): Promise<string | null> {
  // Les simulateurs/émulateurs ne supportent pas les push notifications
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'TRAVIGO-AK',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C0522A',
    });
  }

  const { status: existant } = await Notifications.getPermissionsAsync();
  let statut = existant;

  if (existant !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    statut = status;
  }

  if (statut !== 'granted') return null;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId: 'b401180f-96a4-4e30-9442-7ac81a0f9dd4',
    });
    return data;
  } catch {
    return null;
  }
}

/**
 * Enregistre le token push dans la table utilisateurs.
 */
export async function enregistrerToken(userId: string, token: string): Promise<void> {
  await supabase
    .from('utilisateurs')
    .update({ push_token: token })
    .eq('id', userId);
}

/**
 * Envoie une notification push via l'API Expo.
 * Silencieuse si le token est null/vide.
 */
export async function envoyerNotificationPush(
  token: string,
  titre: string,
  corps: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!token) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title: titre,
        body: corps,
        sound: 'default',
        data: data ?? {},
      }),
    });
  } catch {
    // Notification non critique, on absorbe l'erreur réseau
  }
}

/**
 * Notifie un utilisateur (passager ou chauffeur) par son ID.
 */
export async function notifierUtilisateur(
  userId: string,
  titre: string,
  corps: string,
  data?: Record<string, unknown>
): Promise<void> {
  const { data: row } = await supabase
    .from('utilisateurs')
    .select('push_token')
    .eq('id', userId)
    .single();

  if (row?.push_token) {
    await envoyerNotificationPush(row.push_token, titre, corps, data);
  }
}

/**
 * Notifie tous les chauffeurs disponibles (ceux avec un push_token enregistré).
 */
export async function notifierChauffeursDispo(
  titre: string,
  corps: string,
  data?: Record<string, unknown>
): Promise<void> {
  const { data: chauffeurs } = await supabase
    .from('utilisateurs')
    .select('push_token')
    .eq('role', 'chauffeur')
    .not('push_token', 'is', null);

  if (!chauffeurs) return;
  await Promise.all(
    chauffeurs
      .filter((c) => c.push_token)
      .map((c) => envoyerNotificationPush(c.push_token, titre, corps, data))
  );
}
