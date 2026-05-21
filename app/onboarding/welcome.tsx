import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_SIZES, GRADIENTS, RADII, SPACING } from '@/constants/theme';

const FEATURES = [
  { icon: '⚡', title: 'Hızlı Keşfet', desc: 'Yukarı kaydır, ilanlar akar.' },
  { icon: '🎯', title: 'Sana Özel', desc: 'Algoritma seni tanır, doğru ilanları getirir.' },
  { icon: '🔖', title: 'Kaydet & Başvur', desc: 'Beğendiklerini kaydet, tek dokunuşla başvur.' },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const logoIconSize = Math.min(Math.round(width * 0.2), 100);
  const logoFontSize = Math.min(Math.round(width * 0.096), 44);
  const logoIconFontSize = Math.round(logoIconSize * 0.5);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const featAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim  = useRef(new Animated.Value(0)).current;

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
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
      {/* Logo */}
      <Animated.View style={[styles.logoSection, makeStyle(logoAnim)]}>
        <LinearGradient
          colors={GRADIENTS[0]}
          style={[styles.logoIcon, { width: logoIconSize, height: logoIconSize }]}
        >
          <Text style={[styles.logoIconText, { fontSize: logoIconFontSize }]}>J</Text>
        </LinearGradient>
        <Text style={[styles.logoText, { fontSize: logoFontSize }]}>
          JobReel
        </Text>
        <Text style={styles.tagline}>İş bulmak artık Reels kadar kolay.</Text>
      </Animated.View>

      {/* Feature list */}
      <Animated.View style={[styles.features, makeStyle(featAnim)]}>
        {FEATURES.map((f) => (
          <View key={f.icon} style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>{f.icon}</Text>
            </View>
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
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Başla →</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>Kayıt gerekmez. Tamamen ücretsiz.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef1f8',
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
    color: '#ffffff',
    fontWeight: '800',
  },
  logoText: {
    color: '#051650',
    fontWeight: '800',
    letterSpacing: -1,
  },

  tagline: {
    color: '#8a94a6',
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dde1ea',
    borderRadius: RADII.lg,
    padding: SPACING.md,
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(5,22,80,0.06)',
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
    color: '#051650',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  cta: {
    gap: SPACING.md,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#051650',
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  disclaimer: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.xs,
  },
});
