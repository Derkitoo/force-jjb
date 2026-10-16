import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

export async function askPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Notification de fin de repos : fonctionne écran verrouillé ou appli en arrière-plan. */
export async function scheduleRestEnd(seconds: number): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  return Notifications.scheduleNotificationAsync({
    content: { title: 'Repos terminé', body: 'Série suivante.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
  });
}

export const cancelRest = () => Notifications.cancelAllScheduledNotificationsAsync();
