// ─────────────────────────────────────────────────────────────
// Push notifications service — expo-notifications
// Handles permission request, token registration, and
// scheduling local reminder notifications
// ─────────────────────────────────────────────────────────────

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Permission & token ──────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('[Notifications] Must use physical device for push notifications.');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('squad-goals', {
        name: 'Squad Goals',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      });
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.warn('[Notifications] Failed to get push token:', error);
    return null;
  }
}

// ─── Local notifications ──────────────────────────────────────

/**
 * Schedule a daily workout reminder at a specified time.
 * Returns the notification identifier (use to cancel later).
 */
export async function scheduleWorkoutReminder(
  hour: number,
  minute: number,
  message = "Don't forget to log today's workout! 💪"
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Squad Goals',
      body: message,
      sound: true,
      badge: 1,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
  return id;
}

/**
 * Send an immediate local notification (useful for real-time events
 * when the user is in the app, e.g. a squad member just logged a workout).
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null, // immediate
  });
}

/**
 * Cancel a specific scheduled notification.
 */
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

/**
 * Cancel all scheduled notifications (e.g. on sign-out).
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Notification listeners ───────────────────────────────────

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
