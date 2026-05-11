import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { COLORS } from '@/constants/theme';

export default function Index() {
  const { session, isLoading } = useAuthStore();
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  const [userHydrated, setUserHydrated] = useState(
    () => useUserStore.persist.hasHydrated()
  );
  const router = useRouter();

  useEffect(() => {
    const unsub = useUserStore.persist.onFinishHydration(() => setUserHydrated(true));
    // Safety net: if hydration hangs (e.g. corrupted storage), unblock after 5s
    const timeout = setTimeout(() => setUserHydrated(true), 5000);
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    if (isLoading || !userHydrated) return;

    if (!session) {
      router.replace('/auth');
    } else if (!hasCompletedOnboarding) {
      router.replace('/onboarding/welcome');
    } else {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, hasCompletedOnboarding, userHydrated]);

  return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
}
