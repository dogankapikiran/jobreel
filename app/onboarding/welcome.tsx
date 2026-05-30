import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type Feature = { icon: string; ionIcon?: undefined; title: string; desc: string }
             | { icon?: undefined; ionIcon: keyof typeof Ionicons.glyphMap; iconColor: string; title: string; desc: string };

const FEATURES: Feature[] = [
  { icon: '⚡', title: 'Hızlı Keşfet', desc: 'Yukarı kaydır, ilanlar akar.' },
  { icon: '🎯', title: 'Sana Özel', desc: 'Algoritma seni tanır, doğru ilanları getirir.' },
  { ionIcon: 'bookmark', iconColor: '#f59e0b', title: 'Kaydet & Başvur', desc: 'Beğendiklerini kaydet, tek dokunuşla başvur.' },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const logoIconSize = Math.min(Math.round(width * 0.22), 108);
  const logoFontSize = Math.min(Math.round(width * 0.096), 44);

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

  const makeAnim = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
      {/* Logo */}
      <Animated.View style={[styles.logoSection, makeAnim(logoAnim)]}>
        <Image
          source={require('../../assets/icon.png')}
          style={[styles.logoIcon, { width: logoIconSize, height: logoIconSize }]}
          resizeMode="cover"
        />
        <Text style={[styles.logoText, { fontSize: logoFontSize }]}>JobReel</Text>
        <Text style={styles.tagline}>İş bulmak artık Reels kaydırmak kadar kolay.</Text>
      </Animated.View>

      {/* Feature list */}
      <Animated.View style={[styles.features, makeAnim(featAnim)]}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureCard}>
            <View style={styles.featureIcon}>
              {f.ionIcon
                ? <Ionicons name={f.ionIcon} size={22} color={f.iconColor} />
                : <Text style={styles.featureEmoji}>{f.icon}</Text>
              }
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[styles.cta, makeAnim(ctaAnim)]}>
        <TouchableOpacity
          onPress={() => router.push('/onboarding/preferences')}
          activeOpacity={0.85}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Başla →</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
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
      overflow: 'hidden',
    },
    logoText: {
      color: c.text,
      fontWeight: '800',
      letterSpacing: -1,
    },
    tagline: {
      color: c.textMuted,
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
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.lg,
      padding: SPACING.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.isDark ? 0.2 : 0.05,
      shadowRadius: 6,
      elevation: c.isDark ? 0 : 1,
    },
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: RADII.md,
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.07)' : 'rgba(5,22,80,0.06)',
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
      color: c.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '700',
      marginBottom: 2,
    },
    featureDesc: {
      color: c.textMuted,
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
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
      borderRadius: RADII.full,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: c.isDark ? 0 : 0.28,
      shadowRadius: 14,
      elevation: c.isDark ? 0 : 4,
    },
    primaryBtnText: {
      color: '#ffffff',
      fontSize: FONT_SIZES.lg,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
  });
}
