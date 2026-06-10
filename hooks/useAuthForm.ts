// hooks/useAuthForm.ts

import { useEffect, useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authService } from '@/services/authService';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { track } from '@/services/analytics';

export function useAuthForm() {
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
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const completedOnboardingUserIds = useOnboardingStore((s) => s.completedOnboardingUserIds);
  const [userHydrated, setUserHydrated] = useState(
    () => useUserStore.persist.hasHydrated()
  );
  const [onboardingHydrated, setOnboardingHydrated] = useState(
    () => useOnboardingStore.persist.hasHydrated()
  );
  const router = useRouter();

  useEffect(() => {
    const unsub = useUserStore.persist.onFinishHydration(() => setUserHydrated(true));
    return () => unsub?.();
  }, []);

  useEffect(() => {
    const unsub = useOnboardingStore.persist.onFinishHydration(() => setOnboardingHydrated(true));
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!session || !userHydrated || !onboardingHydrated) return;
    const hasOnboarded =
      completedOnboardingUserIds.includes(session.user.id) || hasCompletedOnboarding;
    router.replace(hasOnboarded ? '/' : '/onboarding/welcome');
  }, [session, hasCompletedOnboarding, completedOnboardingUserIds, userHydrated, onboardingHydrated]);

  const switchMode = useCallback((m: 'signin' | 'signup' | 'forgot') => {
    setMode(m);
    clearError();
    setValidationError('');
    setForgotSent(false);
    setForgotError('');
    setSignupSent(false);
    setConfirmPassword('');
    setPassword('');
  }, [clearError]);

  const submit = useCallback(async () => {
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
      if (ok) {
        track('User Signed Up', { method: 'email' });
        setSignupSent(true);
      }
    }
    setBusy(false);
  }, [mode, email, password, confirmPassword, signIn, signUp, clearError]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      setBusy(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('Apple kimlik token alınamadı');
      const { data, error } = await authService.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
      track('User Signed In', { method: 'apple' });
      const user = data.session?.user;
      if (user && credential.fullName) {
        const name = [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean).join(' ');
        if (name) {
          useUserStore.getState().setProfile({ name });
          api.updateProfile({ display_name: name }).catch(() => {});
        }
      }
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      const msg = e instanceof Error ? e.message : 'Apple ile giriş başarısız oldu.';
      Alert.alert('Hata', msg);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setBusy(true);
      const redirectTo = makeRedirectUri({ scheme: 'jobreel', path: 'auth-callback' });
      const { data, error } = await authService.signInWithOAuth({
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
        const { data: sessionData, error: sessionError } = await authService.setSession({ access_token, refresh_token });
        if (sessionError) throw sessionError;
        track('User Signed In', { method: 'google' });
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
            api.updateProfile({ avatar_url: avatarUrl }).catch(() => {});
          }
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Google ile giriş başarısız oldu.';
      Alert.alert('Hata', msg);
    } finally {
      setBusy(false);
    }
  }, []);

  const sendForgot = useCallback(async () => {
    if (!email) { setForgotError('E-posta adresinizi girin.'); return; }
    setBusy(true);
    setForgotError('');
    const redirectTo = makeRedirectUri({ scheme: 'jobreel', path: 'reset-password' });
    const { error: err } = await authService.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (err) { setForgotError(err.message); }
    else { setForgotSent(true); }
  }, [email]);

  return {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    busy,
    forgotSent,
    forgotError,
    signupSent,
    focusedField,
    setFocusedField,
    validationError,
    error,
    session,
    switchMode,
    submit,
    handleAppleSignIn,
    handleGoogleSignIn,
    sendForgot,
  };
}
