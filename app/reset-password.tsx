import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { FONT_SIZES, GRADIENTS, RADII, SPACING } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const setRecoveryMode = useAuthStore((s) => s.setRecoveryMode);

  async function handleReset() {
    if (password.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return; }
    if (password !== confirmPassword) { setError('Şifreler eşleşmiyor.'); return; }
    setBusy(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
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
          <LinearGradient colors={GRADIENTS[0]} style={styles.logoIcon}>
            <Text style={styles.logoIconText}>J</Text>
          </LinearGradient>
          <Text style={styles.logo}>
            JobReel
          </Text>
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
              placeholderTextColor="rgba(5,22,80,0.35)"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
            />
            <TextInput
              style={[styles.input, focusedField === 'confirm' && styles.inputFocused]}
              placeholder="🔒  Şifre Tekrar"
              placeholderTextColor="rgba(5,22,80,0.35)"
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
