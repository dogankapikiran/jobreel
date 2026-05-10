import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS, RADII, SPACING } from '@/constants/theme';

interface SkeletonBoxProps {
  width: number | string;
  height: number;
  style?: object;
  shimmer: Animated.Value;
}

function SkeletonBox({ width, height, style, shimmer }: SkeletonBoxProps) {
  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.11)'],
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
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.card, { height: cardHeight }]}>
      {/* Şirket satırı */}
      <View style={styles.companyRow}>
        <SkeletonBox width={46} height={46} style={{ borderRadius: RADII.md }} shimmer={shimmer} />
        <View style={styles.companyMeta}>
          <SkeletonBox width={120} height={14} shimmer={shimmer} />
          <SkeletonBox width={80} height={11} style={{ marginTop: 6 }} shimmer={shimmer} />
        </View>
        <SkeletonBox width={48} height={24} style={{ borderRadius: RADII.full }} shimmer={shimmer} />
      </View>

      {/* Başlık */}
      <SkeletonBox width="90%" height={28} style={{ marginBottom: 8 }} shimmer={shimmer} />
      <SkeletonBox width="60%" height={28} style={{ marginBottom: SPACING.md }} shimmer={shimmer} />

      {/* AI reason pill */}
      <SkeletonBox width={200} height={28} style={{ borderRadius: RADII.full, marginBottom: SPACING.sm }} shimmer={shimmer} />

      {/* Etiketler */}
      <View style={styles.tags}>
        <SkeletonBox width={80} height={28} style={{ borderRadius: RADII.full }} shimmer={shimmer} />
        <SkeletonBox width={90} height={28} style={{ borderRadius: RADII.full }} shimmer={shimmer} />
        <SkeletonBox width={70} height={28} style={{ borderRadius: RADII.full }} shimmer={shimmer} />
      </View>

      {/* Maaş bloğu */}
      <SkeletonBox width="100%" height={60} style={{ borderRadius: RADII.md, marginBottom: SPACING.md }} shimmer={shimmer} />

      {/* Explore butonu */}
      <SkeletonBox width="100%" height={48} style={{ borderRadius: RADII.full, marginTop: 'auto' as any }} shimmer={shimmer} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bg,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
    marginBottom: SPACING.md,
  },
  companyMeta: {
    flex: 1,
    gap: 0,
  },
  tags: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
});
