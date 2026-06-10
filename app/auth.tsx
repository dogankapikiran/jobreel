import React, { useMemo } from 'react';
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
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

import { useTheme } from '@/contexts/ThemeContext';
import { useGuestStore } from '@/store/guestStore';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';

import { useAuthForm } from '@/hooks/useAuthForm';
import AuthHeader from '@/components/auth/AuthHeader';
import OAuthButtonGroup from '@/components/auth/OAuthButtonGroup';
import TermsFooter from '@/components/auth/TermsFooter';

export default function AuthScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();

  const {
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
    switchMode,
    submit,
    handleAppleSignIn,
    handleGoogleSignIn,
    sendForgot,
  } = useAuthForm();

  if (mode === 'forgot') {
    return (
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <AuthHeader colors={colors} subtitle="Şifre Sıfırlama" />

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
              <TouchableOpacity
                onPress={sendForgot}
                activeOpacity={0.8}
                disabled={busy}
                style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Bağlantı Gönder</Text>
                )}
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
        <AuthHeader colors={colors} />

        <OAuthButtonGroup
          busy={busy}
          colors={colors}
          onAppleSignIn={handleAppleSignIn}
          onGoogleSignIn={handleGoogleSignIn}
        />

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
            <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
              Giriş Yap
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.tabActive]}
            onPress={() => switchMode('signup')}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
              Kayıt Ol
            </Text>
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
              ✅ Doğrulama e-postası gönderildi{'\n'}{email}{'\n\n'}Gelen kutunuzu kontrol edin ve
              bağlantıya tıklayın.
            </Text>
            <TouchableOpacity onPress={() => switchMode('signin')} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Giriş ekranına dön</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              onPress={submit}
              activeOpacity={0.8}
              disabled={busy}
              style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                useGuestStore.getState().setGuest(true);
                router.replace('/');
              }}
              activeOpacity={0.8}
              style={styles.guestBtn}
            >
              <Text style={styles.guestBtnText}>Üye Olmadan Devam Et</Text>
            </TouchableOpacity>
          </>
        )}

        <TermsFooter colors={colors} />
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
    guestBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.full,
      paddingVertical: SPACING.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.xs,
    },
    guestBtnText: {
      color: c.text,
      fontWeight: '600',
      fontSize: FONT_SIZES.md,
    },
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
      marginVertical: SPACING.xs,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.cardBorder },
    dividerText: { color: c.textMuted, fontSize: FONT_SIZES.xs },
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
