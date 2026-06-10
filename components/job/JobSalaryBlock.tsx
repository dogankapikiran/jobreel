import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';

interface Props {
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: string | null;
  colors: ThemeColors;
}

export default function JobSalaryBlock({
  salaryMin,
  salaryMax,
  salaryCurrency = '$',
  salaryPeriod = 'month',
  colors,
}: Props) {
  if (!salaryMin && !salaryMax) return null;

  const styles = makeStyles(colors);
  const currency = salaryCurrency || '$';
  const period = salaryPeriod || 'month';

  const amountText =
    salaryMin && salaryMax
      ? `${currency}${salaryMin.toLocaleString('tr-TR')} – ${currency}${salaryMax.toLocaleString('tr-TR')}`
      : salaryMin
      ? `${currency}${salaryMin.toLocaleString('tr-TR')}+`
      : `${currency}${salaryMax?.toLocaleString('tr-TR')}`;

  return (
    <View style={styles.salaryBlock}>
      <Text style={styles.salaryLabel}>Maaş Aralığı</Text>
      <Text
        style={[
          styles.salaryAmount,
          { color: colors.isDark ? colors.textMuted : colors.accent },
        ]}
      >
        {amountText}
        <Text style={styles.salaryPeriod}> / {period}</Text>
      </Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    salaryBlock: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: RADII.lg,
      padding: SPACING.md,
      gap: SPACING.xs,
    },
    salaryLabel: {
      color: colors.textDim,
      fontSize: FONT_SIZES.xs,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '500',
    },
    salaryAmount: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    salaryPeriod: {
      color: colors.textDim,
      fontSize: FONT_SIZES.sm,
      fontWeight: '400',
    },
  });
}
