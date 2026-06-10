import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import CompanyLogo from '@/components/CompanyLogo';

interface Props {
  company: string;
  metaLine: string;
  colors: ThemeColors;
}

export default function JobCompanyRow({ company, metaLine, colors }: Props) {
  const styles = makeStyles(colors);

  return (
    <View style={styles.companyRow}>
      <CompanyLogo company={company} size={52} borderRadius={RADII.md} />
      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>{company}</Text>
        <Text style={styles.metaLine} numberOfLines={2}>
          {metaLine}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    companyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    companyInfo: {
      flex: 1,
      gap: SPACING.xs,
    },
    companyName: {
      color: colors.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '700',
    },
    metaLine: {
      color: colors.textMuted,
      fontSize: FONT_SIZES.xs,
      lineHeight: 17,
    },
  });
}
