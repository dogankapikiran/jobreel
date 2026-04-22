import { Redirect } from 'expo-router';
import { useUserStore } from '@/store/userStore';

export default function Index() {
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  return hasCompletedOnboarding
    ? <Redirect href="/(tabs)" />
    : <Redirect href="/onboarding/welcome" />;
}
