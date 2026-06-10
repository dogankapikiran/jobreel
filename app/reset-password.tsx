import React, { useMemo, useState } from 'react';
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
import { router } from 'expo-router';
import { authService } from '@/services/authService';
import { useRecoveryStore } from '@/store/recoveryStore';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const setRecoveryMode = useRecoveryStore((s) => s.setRecoveryMode);
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  async function handleReset() {
    if (password.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return; }
    if (password !== confirmPassword) { setError('Şifreler eşleşmiyor.'); return; }
    setBusy(true);
    setError('');
    const { error: err } = await authService.updateUser({ password });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setRecoveryMode(false);
    setTimeout(() => router.replace('/(tabs)'), 2000);
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.heroSection}>
          <Text style={styles.logo}>JobReel</Text>
          <Text style={styles.sub}>Yeni Şifre Belirle</Text>
        </View>

        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ✅ Şifreniz başarıyla güncellendi!{'\n'}Yönlendiriliyorsunuz...
            </Text>
          </View>
        ) : (
          <>
            <TextInput
              style={[styles.input, focusedField === 'password' && styles.inputFocused]}
              placeholder="🔒  Yeni Şifre"
              placeholderTextColor={colors.textDim}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
            />
            <TextInput
              style={[styles.input, focusedField === 'confirm' && styles.inputFocused]}
              placeholder="🔒  Şifre Tekrar"
              placeholderTextColor={colors.textDim}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
              onPress={handleReset}
              activeOpacity={0.8}
              disabled={busy}
              style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Şifreyi Güncelle</Text>
              )}
            </TouchableOpacity>
          </>
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
  });
}
