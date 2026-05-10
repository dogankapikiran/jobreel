import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, RADII, SPACING } from '@/constants/theme';

interface Props {
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  period: string;
  accent: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString('tr-TR');
}

export default function SalaryBlock({ salaryMin, salaryMax, currency, period, accent }: Props) {
  if (!salaryMin && !salaryMax) return null;

  const label =
    salaryMin && salaryMax
      ? `${currency}${fmt(salaryMin)} – ${currency}${fmt(salaryMax)}`
      : salaryMin
      ? `${currency}${fmt(salaryMin)}+`
      : `${currency}${fmt(salaryMax!)}`;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Maaş Aralığı</Text>
      <View style={styles.row}>
        <Text style={[styles.amount, { color: accent }]}>{label}</Text>
        <Text style={styles.period}> / {period}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADII.lg,
    padding: SPACING.md + 2,
    marginBottom: SPACING.md + 4,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs + 2,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  period: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textDim,
  },
});
