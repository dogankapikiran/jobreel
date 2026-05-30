import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { useFeedStore } from '@/store/feedStore';
import { api } from '@/services/api';

const SPLASH_BG = '#0d0d14';

export default function Index() {
  const { session, isLoading, isRecoveryMode } = useAuthStore();
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  const completedOnboardingUserIds = useUserStore((s) => s.completedOnboardingUserIds);
  const markOnboardingComplete = useUserStore((s) => s.markOnboardingComplete);
  const profile = useUserStore((s) => s.profile);
  const { setJobs, setLoading } = useFeedStore();

  const [userHydrated, setUserHydrated] = useState(
    () => useUserStore.persist.hasHydrated()
  );
  const [showLoadingSplash, setShowLoadingSplash] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const fetchStarted = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (userHydrated) return;
    return useUserStore.persist.onFinishHydration(() => setUserHydrated(true));
  }, []);

  // Migration: mevcut kullanıcıları per-user listesine ekle
  useEffect(() => {
    if (session?.user.id && hasCompletedOnboarding) {
      markOnboardingComplete(session.user.id);
    }
  }, [session?.user.id, hasCompletedOnboarding]);

  useEffect(() => {
    if (isLoading || !userHydrated || isRecoveryMode) return;

    if (!session) {
      router.replace('/auth');
      return;
    }

    const hasOnboarded =
      completedOnboardingUserIds.includes(session.user.id) || hasCompletedOnboarding;

    if (!hasOnboarded) {
      router.replace('/onboarding/welcome');
      return;
    }

    if (fetchStarted.current) return;
    fetchStarted.current = true;

    setShowLoadingSplash(true);

    // İlanlar yüklenirken fake progress: 0 → 80%
    Animated.timing(progress, {
      toValue: 0.8,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    const { sectors, location } = profile.preferences;
    setLoading(true);

    api
      .feed({
        page: 1,
        location: location || 'Istanbul, Turkey',
        sectors: sectors.join(','),
        work_type: 'any',
        seniority: '',
      })
      .then(({ jobs }) => {
        setJobs(jobs);
      })
      .catch(() => {
        // sessizce geç — feed kendi error state'ini yönetir
      })
      .finally(() => {
        setLoading(false);
        // Progress 80% → 100%, sonra fade out ve navigate
        Animated.timing(progress, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            router.replace('/(tabs)');
          });
        });
      });
  }, [session, isLoading, hasCompletedOnboarding, completedOnboardingUserIds, userHydrated, isRecoveryMode]);

  if (showLoadingSplash) {
    return (
      <Animated.View style={[styles.container, { opacity }]}>
        <View style={styles.logoArea}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.bottomArea}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>
    );
  }

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BG,
  },
  logoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 24,
  },
  bottomArea: {
    paddingHorizontal: 40,
    paddingBottom: 64,
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4f8ef7',
    borderRadius: 2,
  },
});
