import { useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useGuestStore } from '@/store/guestStore';
import { useRecoveryStore } from '@/store/recoveryStore';
import { useUserStore } from '@/store/userStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useFeedStore } from '@/store/feedStore';
import { api } from '@/services/api';
import { WorkType, Seniority } from '@/types';

const LOCATION_MAP: Record<string, string> = {
  'İstanbul': 'Istanbul, Turkey', 'istanbul': 'Istanbul, Turkey',
  'Ankara': 'Ankara, Turkey', 'ankara': 'Ankara, Turkey',
  'İzmir': 'Izmir, Turkey', 'izmir': 'Izmir, Turkey',
  'Bursa': 'Bursa, Turkey', 'Antalya': 'Antalya, Turkey',
  'Adana': 'Adana, Turkey', 'Konya': 'Konya, Turkey',
  'Gaziantep': 'Gaziantep, Turkey', 'Kayseri': 'Kayseri, Turkey',
  'Mersin': 'Mersin, Turkey', 'Kocaeli': 'Kocaeli, Turkey',
  'Samsun': 'Samsun, Turkey', 'Trabzon': 'Trabzon, Turkey',
  'Eskişehir': 'Eskişehir, Turkey', 'Remote': 'Remote', 'remote': 'Remote',
};

function normalizeApiLocation(loc: string): string {
  if (!loc) return 'Istanbul, Turkey';
  const trimmed = loc.trim();
  if (LOCATION_MAP[trimmed]) return LOCATION_MAP[trimmed];
  if (trimmed.includes(', Turkey') || trimmed.toLowerCase() === 'remote') return trimmed;
  const firstCity = trimmed.split(',')[0].trim();
  return LOCATION_MAP[firstCity] ?? (firstCity ? `${firstCity}, Turkey` : 'Istanbul, Turkey');
}

const SPLASH_BG = '#0d0d14';

export default function Index() {
  const { session, isLoading } = useAuthStore();
  const isRecoveryMode = useRecoveryStore((s) => s.isRecoveryMode);
  const isGuest = useGuestStore((s) => s.isGuest);
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const completedOnboardingUserIds = useOnboardingStore((s) => s.completedOnboardingUserIds);
  const markOnboardingComplete = useOnboardingStore((s) => s.markOnboardingComplete);
  const setProfile = useUserStore((s) => s.setProfile);
  const setPreferences = useUserStore((s) => s.setPreferences);
  const profile = useUserStore((s) => s.profile);
  const { setJobs, setLoading } = useFeedStore();

  const [userHydrated, setUserHydrated] = useState(
    () => useUserStore.persist.hasHydrated()
  );
  const [onboardingHydrated, setOnboardingHydrated] = useState(
    () => useOnboardingStore.persist.hasHydrated()
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

  useEffect(() => {
    if (onboardingHydrated) return;
    return useOnboardingStore.persist.onFinishHydration(() => setOnboardingHydrated(true));
  }, []);

  // Migration: mevcut kullanıcıları per-user listesine ekle
  useEffect(() => {
    if (session?.user.id && hasCompletedOnboarding) {
      markOnboardingComplete(session.user.id);
    }
  }, [session?.user.id, hasCompletedOnboarding]);

  useEffect(() => {
    if (isLoading || !userHydrated || !onboardingHydrated) return;

    if (isRecoveryMode) {
      fetchStarted.current = false;
      router.replace('/auth');
      return;
    }

    if (!session) {
      if (isGuest) {
        if (fetchStarted.current) return;
        fetchStarted.current = true;

        setShowLoadingSplash(true);

        Animated.timing(progress, {
          toValue: 0.65,
          duration: 1800,
          useNativeDriver: false,
        }).start();

        setLoading(true);

        api.feed({
          page: 1,
          location: 'Istanbul, Turkey',
          sectors: '',
          work_type: 'any',
          seniority: '',
        })
          .then(({ jobs }) => {
            setJobs(jobs);
          })
          .catch(() => {})
          .finally(() => {
            setLoading(false);
            const navigate = () => router.replace('/(tabs)');
            try {
              Animated.timing(progress, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
              }).start(() => {
                try {
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => navigate());
                } catch {
                  navigate();
                }
              });
            } catch {
              navigate();
            }
          });
        return;
      }

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

    // İlanlar yüklenirken fake progress: 0 → 65%
    Animated.timing(progress, {
      toValue: 0.65,
      duration: 1800,
      useNativeDriver: false,
    }).start();

    setLoading(true);

    // Önce profil çek — fresh tercihlerle feed yükle (ilk kurulum veya cache sıfırlama sonrası)
    api.getProfile()
      .catch(() => null)
      .then((data) => {
        if (data) {
          if (data.display_name) setProfile({ name: data.display_name as string });
          if (data.title) setProfile({ title: data.title as string });
          if (data.avatar_url) setProfile({ avatarUrl: data.avatar_url as string });
          const p = data.preferences as Record<string, unknown> | undefined;
          if (p) {
            const rawWorkType = typeof p.work_type === 'string' ? p.work_type : 'any';
            setPreferences({
              sectors: Array.isArray(p.sectors) ? (p.sectors as string[]) : [],
              seniority: Array.isArray(p.seniority) ? (p.seniority as Seniority[]) : [],
              workType: rawWorkType as WorkType,
              location: typeof p.location === 'string' ? p.location : '',
              cities: Array.isArray(p.cities) ? (p.cities as string[]) : [],
              skills: Array.isArray(p.skills) ? (p.skills as string[]) : [],
            });
          }
        }
        const freshPrefs = (data?.preferences as Record<string, unknown> | undefined) ?? {};
        const feedSectors =
          (freshPrefs.sectors as string[] | undefined) ?? profile?.preferences?.sectors ?? [];
        const rawFeedLocation =
          (freshPrefs.location as string | undefined) || profile?.preferences?.location || '';
        const feedLocation = normalizeApiLocation(rawFeedLocation);
        return api.feed({
          page: 1,
          location: feedLocation,
          sectors: feedSectors.join(','),
          work_type: 'any',
          seniority: '',
        });
      })
      .then(({ jobs }) => {
        setJobs(jobs);
      })
      .catch(() => {
        // sessizce geç — feed kendi error state'ini yönetir
      })
      .finally(() => {
        setLoading(false);
        const navigate = () => router.replace('/(tabs)');
        try {
          Animated.timing(progress, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            try {
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => navigate());
            } catch {
              navigate();
            }
          });
        } catch {
          navigate();
        }
      });
  }, [session, isLoading, hasCompletedOnboarding, completedOnboardingUserIds, userHydrated, onboardingHydrated, isRecoveryMode, isGuest]);

  if (showLoadingSplash) {
    return (
      <Animated.View style={[styles.container, { opacity }]}>
        <ImageBackground
          source={require('../assets/splash.png')}
          style={styles.splash}
          resizeMode="cover"
        >
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
        </ImageBackground>
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
  splash: {
    flex: 1,
    justifyContent: 'flex-end',
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
