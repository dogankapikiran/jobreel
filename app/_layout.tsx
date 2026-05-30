import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabase';

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
import { useCompanyStore } from '@/store/companyStore';
import { useUserStore } from '@/store/userStore';
import { api } from '@/services/api';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
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
  const setRecoveryMode = useAuthStore((s) => s.setRecoveryMode);
  const setFollowing = useCompanyStore((s) => s.setFollowing);

  const [userHydrated, setUserHydrated] = useState(
    () => useUserStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (userHydrated) return;
    return useUserStore.persist.onFinishHydration(() => setUserHydrated(true));
  }, []);

  useEffect(() => {
    initialize();
    initAnalytics();
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
      await supabase.auth.setSession({ access_token, refresh_token });
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
    if ((fontsLoaded || fontsError) && !isAuthLoading && userHydrated) SplashScreen.hideAsync();
  }, [fontsLoaded, fontsError, isAuthLoading, userHydrated]);

  if (!fontsLoaded && !fontsError) return null;

  return (
    <ThemeProvider>
      <AppShell />
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
