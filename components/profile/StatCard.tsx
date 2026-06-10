import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZES, SPACING } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';

interface Props {
  value: string | number;
  label: string;
  colors: ThemeColors;
}

export default function StatCard({ value, label, colors }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  value: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  label: {
    fontSize: FONT_SIZES.xs,
  },
});
