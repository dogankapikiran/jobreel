import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId || projectId === 'BURAYA_EAS_INIT_PROJECT_ID') {
      console.warn('[Push] EAS projectId ayarlanmamış — push token alınamıyor');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.savePushToken(token);
    return token;
  } catch (e) {
    console.warn('[Push] Token alınamadı:', e);
    return null;
  }
}
