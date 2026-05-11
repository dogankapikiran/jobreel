import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/services/supabase';
import { ACCENT_GRADIENT, COLORS, FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthScreen() {
  const { bg } = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');

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

  function switchMode(m: 'signin' | 'signup' | 'forgot') {
    setMode(m);
    clearError();
    setValidationError('');
    setForgotSent(false);
    setForgotError('');
  }

  async function submit() {
    if (!email || !password) return;
    setValidationError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setValidationError('Geçerli bir e-posta adresi girin.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setValidationError('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    setBusy(true);
    clearError();
    if (mode === 'signin') {
      await signIn(email.trim(), password);
    } else {
      const ok = await signUp(email.trim(), password);
      if (ok) switchMode('signin');
    }
    setBusy(false);
  }

  async function handleOAuthSignIn(provider: 'google' | 'linkedin_oidc') {
    try {
      setBusy(true);
      const redirectTo = makeRedirectUri({ scheme: 'jobreel', path: 'auth-callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data.url) throw new Error();
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success') {
        await supabase.auth.exchangeCodeForSession(result.url);
      }
    } catch {
      const name = provider === 'google' ? 'Google' : 'LinkedIn';
      Alert.alert('Hata', `${name} ile giriş başarısız oldu.`);
    } finally {
      setBusy(false);
    }
  }

  async function sendForgot() {
    if (!email) { setForgotError('E-posta adresinizi girin.'); return; }
    setBusy(true);
    setForgotError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email);
    setBusy(false);
    if (err) { setForgotError(err.message); }
    else { setForgotSent(true); }
  }

  if (mode === 'forgot') {
    return (
      <KeyboardAvoidingView
        style={[styles.screen, { backgroundColor: bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <LinearGradient
          colors={['rgba(124,109,250,0.15)', '#0d0d14', '#0d0d14']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.inner}>
          <View style={styles.heroSection}>
            <Text style={styles.logo}>
              Job<Text style={styles.accent}>Reel</Text>
            </Text>
            <Text style={styles.sub}>Şifre Sıfırlama</Text>
          </View>

          {forgotSent ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                ✅ Sıfırlama bağlantısı{'\n'}{email}{'\n'}adresine gönderildi.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.forgotDesc}>
                Kayıtlı e-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
              </Text>
              <TextInput
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                placeholder="E-posta"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {forgotError ? <Text style={styles.error}>{forgotError}</Text> : null}
              <TouchableOpacity onPress={sendForgot} activeOpacity={0.8} disabled={busy} style={styles.gradientBtnWrapper}>
                <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Bağlantı Gönder</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => switchMode('signin')} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Giriş ekranına dön</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['rgba(124,109,250,0.15)', '#0d0d14', '#0d0d14']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.inner}>
        <View style={styles.heroSection}>
          <Text style={styles.logo}>
            Job<Text style={styles.accent}>Reel</Text>
          </Text>
          <Text style={styles.sub}>Kariyerini keşfet</Text>
        </View>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={() => handleOAuthSignIn('google')}
          activeOpacity={0.8}
          disabled={busy}
        >
          <Text style={styles.googleBtnText}>G  Google ile Devam Et</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkedInAuthBtn}
          onPress={() => handleOAuthSignIn('linkedin_oidc')}
          activeOpacity={0.8}
          disabled={busy}
        >
          <Text style={styles.linkedInAuthBtnText}>in  LinkedIn ile Devam Et</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>veya e-posta ile</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'signin' && styles.tabActive]}
            onPress={() => switchMode('signin')}
          >
            <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>Giriş Yap</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.tabActive]}
            onPress={() => switchMode('signup')}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.input, focusedField === 'email' && styles.inputFocused]}
          placeholder="✉  E-posta"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={[styles.input, focusedField === 'password' && styles.inputFocused]}
          placeholder="🔒  Şifre"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
          secureTextEntry
        />

        {mode === 'signin' && (
          <TouchableOpacity onPress={() => switchMode('forgot')} style={styles.forgotLink}>
            <Text style={styles.forgotLinkText}>Şifremi unuttum</Text>
          </TouchableOpacity>
        )}

        {(validationError || error) && (
          <Text style={styles.error}>{validationError || error}</Text>
        )}

        <TouchableOpacity onPress={submit} activeOpacity={0.8} disabled={busy} style={styles.gradientBtnWrapper}>
          <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg + 8,
    gap: SPACING.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADII.md,
    padding: 4,
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
  inputFocused: {
    borderColor: COLORS.accent,
    borderWidth: 1.5,
    backgroundColor: 'rgba(124,109,250,0.06)',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.xs,
  },
  forgotLinkText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.sm,
  },
  forgotDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  error: {
    color: '#ff6b6b',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  gradientBtnWrapper: {
    borderRadius: RADII.full,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  gradientBtn: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
  backLink: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  backLinkText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FONT_SIZES.sm,
  },
  successBox: {
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.3)',
    borderRadius: RADII.md,
    padding: SPACING.md,
  },
  successText: {
    color: '#34c759',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: FONT_SIZES.xs },
  googleBtn: {
    backgroundColor: '#fff',
    borderRadius: RADII.full,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: { color: '#1a1a1a', fontWeight: '700', fontSize: FONT_SIZES.md },
  linkedInAuthBtn: {
    backgroundColor: '#0A66C2',
    borderRadius: RADII.full,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedInAuthBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
});
