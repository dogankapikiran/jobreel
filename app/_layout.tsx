import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { registerForPushNotifications } from '@/services/notifications';
import { checkClosedJobs } from '@/services/jobStatusChecker';
import {
  Syne_400Regular,
  Syne_600SemiBold,
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, useColorScheme } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useCompanyStore } from '@/store/companyStore';
import { api } from '@/services/api';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { initAnalytics, identify } from '@/services/analytics';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    Syne_400Regular,
    Syne_600SemiBold,
    Syne_700Bold,
    Syne_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  const initialize = useAuthStore((s) => s.initialize);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const session = useAuthStore((s) => s.session);
  const setFollowing = useCompanyStore((s) => s.setFollowing);

  useEffect(() => {
    initialize();
    initAnalytics();
  }, []);

  useEffect(() => {
    if (session) {
      identify(session.user.id);
      registerForPushNotifications();
      api.getFollowedCompanies().then(setFollowing).catch(() => {});
      checkClosedJobs().catch(() => {});
    }
  }, [!!session]);

  useEffect(() => {
    if ((fontsLoaded || fontsError) && !isAuthLoading) SplashScreen.hideAsync();
  }, [fontsLoaded, fontsError, isAuthLoading]);

  const scheme = useColorScheme();

  if (!fontsLoaded && !fontsError) return null;

  return (
    <ThemeProvider>
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="job/[id]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="linkedin-connect" options={{ animation: 'slide_from_bottom', presentation: 'transparentModal' }} />
        <Stack.Screen name="alerts" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="terms" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
