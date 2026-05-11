import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ACCENT_GRADIENT, COLORS, FONT_SIZES, GRADIENTS, RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Hızlı Keşfet',
    desc: 'Yukarı kaydır, ilanlar akar.',
    gradient: true,
  },
  {
    icon: '🎯',
    title: 'Sana Özel',
    desc: 'Algoritma seni tanır, doğru ilanları getirir.',
    gradient: false,
  },
  {
    icon: '🔖',
    title: 'Kaydet & Başvur',
    desc: 'Beğendiklerini kaydet, tek dokunuşla başvur.',
    gradient: false,
  },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { bg } = useTheme();
  const { width } = useWindowDimensions();

  const logoIconSize = Math.min(Math.round(width * 0.2), 100);
  const logoFontSize = Math.min(Math.round(width * 0.096), 44);
  const logoIconFontSize = Math.round(logoIconSize * 0.5);

  const logoAnim  = useRef(new Animated.Value(0)).current;
  const featAnim  = useRef(new Animated.Value(0)).current;
  const ctaAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(180, [
      Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
      Animated.spring(featAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
      Animated.spring(ctaAnim,  { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
  }, []);

  const makeStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg, backgroundColor: bg }]}>
      {/* Arka plan gradient */}
      <LinearGradient
        colors={['#1a0f35', '#0d0d14', '#0d0d14']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Logo */}
      <Animated.View style={[styles.logoSection, makeStyle(logoAnim)]}>
        <LinearGradient
          colors={GRADIENTS[0]}
          style={[styles.logoIcon, { width: logoIconSize, height: logoIconSize }]}
        >
          <Text style={[styles.logoIconText, { fontSize: logoIconFontSize }]}>J</Text>
        </LinearGradient>
        <Text style={[styles.logoText, { fontSize: logoFontSize }]}>
          Job<Text style={styles.logoAccent}>Reel</Text>
        </Text>
        <Text style={styles.tagline}>İş bulmak artık Reels kadar kolay.</Text>
      </Animated.View>

      {/* Feature list */}
      <Animated.View style={[styles.features, makeStyle(featAnim)]}>
        {FEATURES.map((f, i) => (
          <View key={f.icon} style={styles.featureCard}>
            {f.gradient ? (
              <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>{f.icon}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.featureIcon, styles.featureIconMuted]}>
                <Text style={styles.featureEmoji}>{f.icon}</Text>
              </View>
            )}
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[styles.cta, makeStyle(ctaAnim)]}>
        <TouchableOpacity
          onPress={() => router.push('/onboarding/preferences')}
          activeOpacity={0.85}
          style={styles.primaryBtnWrapper}
        >
          <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Başla →</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Kayıt gerekmez. Tamamen ücretsiz.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.xl,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    gap: SPACING.md,
  },
  logoIcon: {
    borderRadius: RADII.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  logoText: {
    color: COLORS.white,
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
    gap: SPACING.sm + 2,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: RADII.lg,
    padding: SPACING.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureIconMuted: {
    backgroundColor: 'rgba(255,255,255,0.08)',
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
  primaryBtnWrapper: {
    width: '100%',
    borderRadius: RADII.full,
    overflow: 'hidden',
  },
  primaryBtn: {
    height: 56,
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
