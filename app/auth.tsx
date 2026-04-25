import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { COLORS, FONT_SIZES, RADII, SPACING } from '@/constants/theme';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const { signIn, signUp, error, clearError, session } = useAuthStore();
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  const [userHydrated, setUserHydrated] = useState(
    () => useUserStore.persist.hasHydrated()
  );
  const router = useRouter();

  useEffect(() => {
    const unsub = useUserStore.persist.onFinishHydration(() => setUserHydrated(true));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!session || !userHydrated) return;
    router.replace(hasCompletedOnboarding ? '/(tabs)' : '/onboarding/welcome');
  }, [session, hasCompletedOnboarding, userHydrated]);

  async function submit() {
    if (!email || !password) return;
    setBusy(true);
    clearError();
    if (mode === 'signin') {
      await signIn(email, password);
    } else {
      const ok = await signUp(email, password);
      if (ok) setMode('signin');
    }
    setBusy(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>
          Job<Text style={styles.accent}>Reel</Text>
        </Text>
        <Text style={styles.sub}>Kariyerini keşfet</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'signin' && styles.tabActive]}
            onPress={() => { setMode('signin'); clearError(); }}
          >
            <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>Giriş Yap</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.tabActive]}
            onPress={() => { setMode('signup'); clearError(); }}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.btn} onPress={submit} activeOpacity={0.8} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg + 8,
    gap: SPACING.md,
  },
  logo: {
    color: COLORS.white,
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: SPACING.xs,
  },
  accent: { color: COLORS.accent },
  sub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADII.md,
    padding: 4,
    marginBottom: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.sm,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: FONT_SIZES.sm },
  tabTextActive: { color: COLORS.white },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
  error: {
    color: '#ff6b6b',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADII.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
});
