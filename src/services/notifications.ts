import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function demanderPermissionNotifications(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  const { data } = await Notifications.getExpoPushTokenAsync();
  return data ?? null;
}

export async function envoyerNotificationLocale(titre: string, corps: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title: titre, body: corps },
    trigger: null,
  });
}
