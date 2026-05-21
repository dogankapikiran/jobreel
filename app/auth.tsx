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
import { useRouter } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT_SIZES, GRADIENTS, RADII, SPACING } from '@/constants/theme';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [signupSent, setSignupSent] = useState(false);
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
    setSignupSent(false);
    setConfirmPassword('');
  }

  async function submit() {
    if (!email || !password) return;
    setValidationError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setValidationError('Geçerli bir e-posta adresi girin.');
      return;
    }
    if (mode === 'signup') {
      if (password.length < 8) {
        setValidationError('Şifre en az 8 karakter olmalıdır.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Şifreler eşleşmiyor.');
        return;
      }
    }
    setBusy(true);
    clearError();
    if (mode === 'signin') {
      await signIn(email.trim(), password);
    } else {
      const ok = await signUp(email.trim(), password);
      if (ok) setSignupSent(true);
    }
    setBusy(false);
  }

  async function handleGoogleSignIn() {
    try {
      setBusy(true);
      const redirectTo = makeRedirectUri({ scheme: 'jobreel', path: 'auth-callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
      });
      if (error || !data.url) throw new Error(error?.message ?? 'OAuth URL alınamadı');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success') {
        const fragment = result.url.split('#')[1] ?? '';
        const params = new URLSearchParams(fragment);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (!access_token || !refresh_token) throw new Error('Oturum bilgisi alınamadı');
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;
        if (user) {
          const meta = user.user_metadata ?? {};
          const fullName: string = meta.full_name ?? meta.name ?? '';
          const avatarUrl: string = meta.avatar_url ?? meta.picture ?? '';
          if (fullName || avatarUrl) {
            useUserStore.getState().setProfile({
              ...(fullName ? { name: fullName } : {}),
              ...(avatarUrl ? { avatarUrl } : {}),
            });
          }
          if (avatarUrl) {
            supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id).then(() => {});
          }
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Google ile giriş başarısız oldu.';
      Alert.alert('Hata', msg);
    } finally {
      setBusy(false);
    }
  }

  async function sendForgot() {
    if (!email) { setForgotError('E-posta adresinizi girin.'); return; }
    setBusy(true);
    setForgotError('');
    const redirectTo = makeRedirectUri({ scheme: 'jobreel', path: 'reset-password' });
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (err) { setForgotError(err.message); }
    else { setForgotSent(true); }
  }

  if (mode === 'forgot') {
    return (
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <View style={styles.heroSection}>
            <LinearGradient colors={GRADIENTS[0]} style={styles.logoIcon}>
              <Text style={styles.logoIconText}>J</Text>
            </LinearGradient>
            <Text style={styles.logo}>
              JobReel
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
                placeholderTextColor="rgba(5,22,80,0.35)"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {forgotError ? <Text style={styles.error}>{forgotError}</Text> : null}
              <TouchableOpacity onPress={sendForgot} activeOpacity={0.8} disabled={busy} style={[styles.primaryBtn, busy && { opacity: 0.6 }]}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Bağlantı Gönder</Text>}
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
      <View style={styles.inner}>
        <View style={styles.heroSection}>
          <LinearGradient colors={GRADIENTS[0]} style={styles.logoIcon}>
            <Text style={styles.logoIconText}>J</Text>
          </LinearGradient>
          <Text style={styles.logo}>
            JobReel
          </Text>
          <Text style={styles.sub}>Kariyerini keşfet</Text>
        </View>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleSignIn}
          activeOpacity={0.8}
          disabled={busy}
        >
          <Text style={styles.googleBtnText}>G  Google ile Devam Et</Text>
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
          placeholderTextColor="rgba(5,22,80,0.35)"
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
          placeholderTextColor="rgba(5,22,80,0.35)"
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
          secureTextEntry
        />

        {mode === 'signup' && (
          <TextInput
            style={[styles.input, focusedField === 'confirmPassword' && styles.inputFocused]}
            placeholder="🔒  Şifre Tekrar"
            placeholderTextColor="rgba(5,22,80,0.35)"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() => setFocusedField('confirmPassword')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry
          />
        )}

        {mode === 'signin' && (
          <TouchableOpacity onPress={() => switchMode('forgot')} style={styles.forgotLink}>
            <Text style={styles.forgotLinkText}>Şifremi unuttum</Text>
          </TouchableOpacity>
        )}

        {(validationError || error) && (
          <Text style={styles.error}>{validationError || error}</Text>
        )}

        {signupSent ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ✅ Doğrulama e-postası gönderildi{'\n'}{email}{'\n\n'}Gelen kutunuzu kontrol edin ve bağlantıya tıklayın.
            </Text>
            <TouchableOpacity onPress={() => switchMode('signin')} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Giriş ekranına dön</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={submit}
            activeOpacity={0.8}
            disabled={busy}
            style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef1f8',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg + 8,
    gap: SPACING.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  logoIconText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
  },
  logo: {
    color: '#051650',
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: SPACING.xs,
  },

  sub: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dde1ea',
    borderRadius: RADII.md,
    padding: 4,
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#051650',
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: { color: '#8a94a6', fontWeight: '600', fontSize: FONT_SIZES.sm },
  tabTextActive: { color: '#ffffff' },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dde1ea',
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    color: '#051650',
    fontSize: FONT_SIZES.md,
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputFocused: {
    borderColor: '#051650',
    borderWidth: 1.5,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.xs,
  },
  forgotLinkText: {
    color: '#051650',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  forgotDesc: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  error: {
    color: '#ef4444',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#051650',
    borderRadius: RADII.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: FONT_SIZES.md },
  backLink: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  backLinkText: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.sm,
  },
  successBox: {
    backgroundColor: 'rgba(22,163,74,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.22)',
    borderRadius: RADII.md,
    padding: SPACING.md,
  },
  successText: {
    color: '#16a34a',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#dde1ea' },
  dividerText: { color: '#8a94a6', fontSize: FONT_SIZES.xs },
  googleBtn: {
    backgroundColor: '#ffffff',
    borderRadius: RADII.full,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dde1ea',
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  googleBtnText: { color: '#051650', fontWeight: '700', fontSize: FONT_SIZES.md },
});
