import React, { useEffect, useMemo, useState } from 'react';
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
import * as AppleAuthentication from 'expo-apple-authentication';

WebBrowser.maybeCompleteAuthSession();

import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/services/supabase';
import { FONT_SIZES, GRADIENTS, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

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
  const completedOnboardingUserIds = useUserStore((s) => s.completedOnboardingUserIds);
  const [userHydrated, setUserHydrated] = useState(
    () => useUserStore.persist.hasHydrated()
  );
  const router = useRouter();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    const unsub = useUserStore.persist.onFinishHydration(() => setUserHydrated(true));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!session || !userHydrated) return;
    const hasOnboarded =
      completedOnboardingUserIds.includes(session.user.id) || hasCompletedOnboarding;
    router.replace(hasOnboarded ? '/' : '/onboarding/welcome');
  }, [session, hasCompletedOnboarding, completedOnboardingUserIds, userHydrated]);

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

  async function handleAppleSignIn() {
    try {
      setBusy(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('Apple kimlik token alınamadı');
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
      const user = data.session?.user;
      if (user && credential.fullName) {
        const name = [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean).join(' ');
        if (name) {
          useUserStore.getState().setProfile({ name });
          supabase.from('profiles').update({ display_name: name }).eq('user_id', user.id).then(() => {});
        }
      }
    } catch (e: unknown) {
      if ((e as any).code === 'ERR_REQUEST_CANCELED') return;
      const msg = e instanceof Error ? e.message : 'Apple ile giriş başarısız oldu.';
      Alert.alert('Hata', msg);
    } finally {
      setBusy(false);
    }
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
            supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', user.id).then(() => {});
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
            <Text style={styles.logo}>JobReel</Text>
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
                placeholderTextColor={colors.textDim}
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
          <Text style={styles.logo}>JobReel</Text>
          <Text style={styles.sub}>Kariyerini keşfet</Text>
        </View>

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              colors.isDark
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={RADII.full}
            style={styles.appleBtn}
            onPress={handleAppleSignIn}
          />
        )}

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
          placeholderTextColor={colors.textDim}
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
          placeholderTextColor={colors.textDim}
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
            placeholderTextColor={colors.textDim}
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

        {validationError ? (
          <Text style={styles.error}>{validationError}</Text>
        ) : error === 'already_registered' ? (
          <View style={styles.alreadyRegisteredBox}>
            <Text style={styles.alreadyRegisteredText}>
              Bu e-posta adresi zaten kayıtlı.
            </Text>
            <TouchableOpacity onPress={() => switchMode('signin')}>
              <Text style={styles.alreadyRegisteredLink}>Giriş yapmak için tıklayın →</Text>
            </TouchableOpacity>
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

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

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
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
      shadowColor: '#7c6dfa',
      shadowOffset: { width: 0, height: c.isDark ? 0 : 6 },
      shadowOpacity: c.isDark ? 0.55 : 0.22,
      shadowRadius: c.isDark ? 22 : 12,
      elevation: c.isDark ? 0 : 4,
    },
    logoIconText: {
      color: '#ffffff',
      fontSize: 34,
      fontWeight: '800',
    },
    logo: {
      color: c.isDark ? '#ffffff' : c.text,
      fontSize: 40,
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: -1,
      marginBottom: SPACING.xs,
    },
    sub: {
      color: c.isDark ? 'rgba(255,255,255,0.55)' : c.textMuted,
      fontSize: FONT_SIZES.md,
      textAlign: 'center',
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      padding: 4,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.isDark ? 0 : 0.06,
      shadowRadius: 6,
      elevation: c.isDark ? 0 : 1,
    },
    tab: {
      flex: 1,
      paddingVertical: SPACING.sm,
      borderRadius: RADII.sm,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: c.isDark ? c.cardBg : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0 : 0.2,
      shadowRadius: 6,
      elevation: c.isDark ? 0 : 2,
    },
    tabText: { color: c.textMuted, fontWeight: '600', fontSize: FONT_SIZES.sm },
    tabTextActive: { color: '#ffffff' },
    input: {
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 4,
      color: c.text,
      fontSize: FONT_SIZES.md,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.isDark ? 0 : 0.05,
      shadowRadius: 4,
      elevation: c.isDark ? 0 : 1,
    },
    inputFocused: {
      borderColor: c.isDark ? 'rgba(255,255,255,0.30)' : c.accent,
      borderWidth: 1.5,
    },
    forgotLink: {
      alignSelf: 'flex-end',
      marginTop: -SPACING.xs,
    },
    forgotLinkText: {
      color: c.text,
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
    },
    forgotDesc: {
      color: c.textMuted,
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
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
      borderRadius: RADII.full,
      paddingVertical: SPACING.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.xs,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: c.isDark ? 0 : 0.28,
      shadowRadius: 14,
      elevation: c.isDark ? 0 : 4,
    },
    primaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: FONT_SIZES.md },
    backLink: {
      alignItems: 'center',
      marginTop: SPACING.sm,
    },
    backLinkText: {
      color: c.textMuted,
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
    dividerLine: { flex: 1, height: 1, backgroundColor: c.cardBorder },
    dividerText: { color: c.textMuted, fontSize: FONT_SIZES.xs },
    appleBtn: {
      height: 50,
      width: '100%',
    },
    googleBtn: {
      backgroundColor: c.bgDeep,
      borderRadius: RADII.full,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.cardBorder,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0 : 0.08,
      shadowRadius: 8,
      elevation: c.isDark ? 0 : 2,
    },
    googleBtnText: { color: c.text, fontWeight: '700', fontSize: FONT_SIZES.md },
    alreadyRegisteredBox: {
      backgroundColor: 'rgba(239,68,68,0.07)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.2)',
      borderRadius: RADII.md,
      padding: SPACING.md,
      alignItems: 'center',
      gap: SPACING.xs,
    },
    alreadyRegisteredText: {
      color: '#ef4444',
      fontSize: FONT_SIZES.sm,
      textAlign: 'center',
      fontWeight: '600',
    },
    alreadyRegisteredLink: {
      color: c.text,
      fontSize: FONT_SIZES.sm,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
  });
}
