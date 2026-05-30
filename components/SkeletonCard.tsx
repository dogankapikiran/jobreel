import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonBoxProps {
  width: number | string;
  height: number;
  style?: object;
  shimmerLight: string;
  shimmerDark: string;
  anim: Animated.Value;
}

function SkeletonBox({ width, height, style, shimmerLight, shimmerDark, anim }: SkeletonBoxProps) {
  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [shimmerLight, shimmerDark],
  });
  return (
    <Animated.View
      style={[{ width, height, borderRadius: RADII.sm, backgroundColor: bg }, style]}
    />
  );
}

interface Props {
  cardHeight: number;
}

export default function SkeletonCard({ cardHeight }: Props) {
  const { bg, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  const shimmerLight = isDark ? '#111d35' : '#e8ecf4';
  const shimmerDark  = isDark ? '#1a2540' : '#d0d5e4';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const box = (width: number | string, height: number, style?: object) => (
    <SkeletonBox
      width={width}
      height={height}
      style={style}
      shimmerLight={shimmerLight}
      shimmerDark={shimmerDark}
      anim={anim}
    />
  );

  return (
    <View style={[styles.card, { height: cardHeight, backgroundColor: bg }]}>
      <View style={styles.companyRow}>
        {box(46, 46, { borderRadius: RADII.md })}
        <View style={styles.companyMeta}>
          {box(120, 14)}
          {box(80, 11, { marginTop: 6 })}
        </View>
        {box(48, 24, { borderRadius: RADII.full })}
      </View>

      {box('90%', 28, { marginBottom: 8 })}
      {box('60%', 28, { marginBottom: SPACING.md })}
      {box(200, 28, { borderRadius: RADII.full, marginBottom: SPACING.sm })}

      <View style={styles.tags}>
        {box(80, 28, { borderRadius: RADII.full })}
        {box(90, 28, { borderRadius: RADII.full })}
        {box(70, 28, { borderRadius: RADII.full })}
      </View>

      {box('100%', 60, { borderRadius: RADII.md, marginBottom: SPACING.md })}
      {box('100%', 48, { borderRadius: RADII.full, marginTop: 'auto' as any })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
    marginBottom: SPACING.md,
  },
  companyMeta: {
    flex: 1,
  },
  tags: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
});
