import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, GRADIENTS, RADII, SPACING } from '@/constants/theme';

const FEATURES = [
  { icon: '⚡', title: 'Hızlı Keşfet', desc: 'Yukarı kaydır, ilanlar akar.' },
  { icon: '🎯', title: 'Sana Özel', desc: 'Algoritma seni tanır, doğru ilanları getirir.' },
  { icon: '🔖', title: 'Kaydet & Başvur', desc: 'Beğendiklerini kaydet, tek dokunuşla başvur.' },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <LinearGradient colors={GRADIENTS[0]} style={styles.logoIcon}>
          <Text style={styles.logoIconText}>J</Text>
        </LinearGradient>
        <Text style={styles.logoText}>
          Job<Text style={styles.logoAccent}>Reel</Text>
        </Text>
        <Text style={styles.tagline}>İş bulmak artık Reels kadar kolay.</Text>
      </View>

      {/* Feature list */}
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.icon} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>{f.icon}</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <LinearGradient colors={GRADIENTS[0]} style={styles.primaryBtn}>
          <TouchableOpacity
            style={styles.btnInner}
            onPress={() => router.push('/onboarding/preferences')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Başla →</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.disclaimer}>
          Kayıt gerekmez. Tamamen ücretsiz.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'space-between',
    padding: SPACING.xl,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    gap: SPACING.md,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: RADII.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: '800',
  },
  logoText: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  logoAccent: {
    color: COLORS.accent,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  features: {
    gap: SPACING.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  cta: {
    gap: SPACING.md,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    borderRadius: RADII.full,
    height: 56,
  },
  btnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  disclaimer: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.xs,
  },
});
