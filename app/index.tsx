import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';

export default function Index() {
  const { session, isLoading, isRecoveryMode } = useAuthStore();
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  const [userHydrated, setUserHydrated] = useState(
    () => useUserStore.persist.hasHydrated()
  );
  const router = useRouter();

  useEffect(() => {
    if (userHydrated) return;
    return useUserStore.persist.onFinishHydration(() => setUserHydrated(true));
  }, []);

  useEffect(() => {
    if (isLoading || !userHydrated || isRecoveryMode) return;

    if (!session) {
      router.replace('/auth');
    } else if (!hasCompletedOnboarding) {
      router.replace('/onboarding/welcome');
    } else {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, hasCompletedOnboarding, userHydrated, isRecoveryMode]);

  return <View style={{ flex: 1, backgroundColor: '#eef1f8' }} />;
}
