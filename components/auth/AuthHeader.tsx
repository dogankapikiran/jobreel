import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZES, SPACING, ThemeColors } from '@/constants/theme';

interface Props {
  colors: ThemeColors;
  subtitle?: string;
}

export default function AuthHeader({ colors, subtitle = 'Kariyerini keşfet' }: Props) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.heroSection}>
      <Text style={styles.logo}>JobReel</Text>
      <Text style={styles.sub}>{subtitle}</Text>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    heroSection: {
      alignItems: 'center',
      marginBottom: SPACING.sm,
      gap: SPACING.sm,
    },
    logo: {
      color: c.isDark ? '#ffffff' : c.text,
      fontSize: 40,
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: -1,
      marginBottom: SPACING.xs,
    },
    sub: {
      color: c.isDark ? 'rgba(255,255,255,0.55)' : c.textMuted,
      fontSize: FONT_SIZES.md,
      textAlign: 'center',
    },
  });
}
