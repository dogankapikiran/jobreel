import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useUserStore } from '@/store/userStore';
import { api } from '@/services/api';
import { COLORS, FONT_SIZES, RADII, SPACING } from '@/constants/theme';

const LINKEDIN_CLIENT_ID = process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID ?? '';
const LINKEDIN_REDIRECT_URI = 'https://api.jobreel.app/linkedin/callback';

const AUTH_URL =
  `https://www.linkedin.com/oauth/v2/authorization?` +
  `response_type=code` +
  `&client_id=${LINKEDIN_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}` +
  `&scope=openid%20profile%20email`;

export default function LinkedInConnectModal() {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setProfile = useUserStore((s) => s.setProfile);

  async function handleConnect() {
    setError(null);
    setConnecting(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        AUTH_URL,
        'jobreel://linkedin-callback'
      );

      if (result.type !== 'success') {
        setError('LinkedIn bağlantısı iptal edildi.');
        return;
      }

      const code = Linking.parse(result.url).queryParams?.code as string | undefined;
      if (!code) {
        setError('LinkedIn bağlantısı kurulamadı. Tekrar deneyin.');
        return;
      }

      const profile = await api.connectLinkedIn(code);
      setProfile({
        linkedInConnected: true,
        linkedInName: profile.name,
        linkedInHeadline: profile.headline,
        linkedInPhotoUrl: profile.photo_url,
      });
      router.back();
    } catch {
      setError('LinkedIn bağlantısı kurulamadı. Tekrar deneyin.');
    } finally {
      setConnecting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>in</Text>
          </View>
          <Text style={styles.title}>LinkedIn Profilini Bağla</Text>
        </View>

        <Text style={styles.description}>
          LinkedIn hesabını bağlayarak profilini otomatik doldur. Adın, ünvanın ve fotoğrafın LinkedIn'den alınır.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, connecting && styles.btnDisabled]}
          onPress={handleConnect}
          disabled={connecting || !LINKEDIN_CLIENT_ID}
          activeOpacity={0.8}
        >
          {connecting
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.btnText}>LinkedIn ile Bağlan</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.cancelText}>Vazgeç</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  logoBadge: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: '#0A66C2',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: COLORS.white, fontWeight: '800', fontSize: 18 },
  title: { color: COLORS.white, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  description: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  error: { color: '#ff6b6b', fontSize: FONT_SIZES.sm, textAlign: 'center' },
  btn: {
    backgroundColor: '#0A66C2',
    borderRadius: RADII.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
  cancelBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  cancelText: { color: COLORS.textDim, fontSize: FONT_SIZES.sm },
});
