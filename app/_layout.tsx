import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { authService } from '@/services/authService';

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
import { useAuthStore } from '@/store/authStore';
import { useGuestStore } from '@/store/guestStore';
import { useRecoveryStore } from '@/store/recoveryStore';
import { useCompanyStore } from '@/store/companyStore';
import { useUserStore } from '@/store/userStore';
import { api } from '@/services/api';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { initAnalytics, identify } from '@/services/analytics';
import ErrorBoundary from '@/components/ErrorBoundary';

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
  const setRecoveryMode = useRecoveryStore((s) => s.setRecoveryMode);
  const setFollowing = useCompanyStore((s) => s.setFollowing);

  const [userHydrated, setUserHydrated] = useState(
    () => useUserStore.persist.hasHydrated()
  );
  const [guestHydrated, setGuestHydrated] = useState(
    () => useGuestStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (userHydrated) return;
    return useUserStore.persist.onFinishHydration(() => setUserHydrated(true));
  }, []);

  useEffect(() => {
    if (guestHydrated) return;
    return useGuestStore.persist.onFinishHydration(() => setGuestHydrated(true));
  }, []);

  useEffect(() => {
    initialize();
    initAnalytics();

    // Set up global crash logger in production
    if (!__DEV__) {
      const rnGlobal = global as unknown as {
        ErrorUtils?: {
          getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
          setGlobalHandler: (fn: (error: Error, isFatal?: boolean) => void) => void;
        };
      };
      if (rnGlobal.ErrorUtils) {
        const defaultHandler = rnGlobal.ErrorUtils.getGlobalHandler();
        rnGlobal.ErrorUtils.setGlobalHandler(async (error, isFatal) => {
          try {
            await api.logError(
              error.message || 'Global Error',
              error.stack || '',
              { isFatal, platform: 'native_global' }
            );
          } catch {}
          defaultHandler(error, isFatal);
        });
      }
    }
  }, []);

  useEffect(() => {
    const SUPABASE_HOST = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace('https://', '');
    const processUrl = async (url: string) => {
      const fragment = url.split('#')[1] ?? '';
      const params = new URLSearchParams(fragment);
      if (params.get('type') !== 'recovery') return;
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (!access_token || !refresh_token) return;
      // Verify the token was issued by our Supabase project before trusting it
      try {
        const payload = JSON.parse(atob(access_token.split('.')[1]));
        if (!SUPABASE_HOST || payload.iss !== `https://${SUPABASE_HOST}/auth/v1`) return;
      } catch {
        return;
      }
      setRecoveryMode(true);
      await authService.setSession({ access_token, refresh_token });
      router.replace('/reset-password');
    };
    Linking.getInitialURL().then(url => { if (url) processUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => processUrl(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (session) {
      identify(session.user.id);
api.getFollowedCompanies().then(setFollowing).catch(() => {});
      checkClosedJobs().catch(() => {});
    }
  }, [!!session]);

  useEffect(() => {
    if ((fontsLoaded || fontsError) && !isAuthLoading && userHydrated && guestHydrated) SplashScreen.hideAsync();
  }, [fontsLoaded, fontsError, isAuthLoading, userHydrated, guestHydrated]);

  if (!fontsLoaded && !fontsError) return null;

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

function AppShell() {
  const { bg, isDark } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="job/[id]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
<Stack.Screen name="alerts" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="terms" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="reset-password" options={{ animation: 'fade', headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
