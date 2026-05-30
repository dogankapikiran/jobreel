import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type TagVariant = 'remote' | 'hybrid' | 'office' | 'senior' | 'lead' | 'junior' | 'mid' | 'startup' | 'scaleup' | string;

interface TagStyle {
  bg: string;
  border: string;
  text: string;
}

function resolveStyle(variant: TagVariant | undefined, c: ThemeColors): TagStyle {
  switch (variant) {
    case 'remote':
      return { bg: 'rgba(79,172,254,0.08)', border: 'rgba(79,172,254,0.2)', text: '#7ec8fd' };
    case 'hybrid':
      return { bg: 'rgba(46,204,113,0.07)', border: 'rgba(46,204,113,0.2)', text: '#5ddb8f' };
    case 'office':
      return c.isDark
        ? { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.6)' }
        : { bg: c.cardBg, border: c.cardBorder, text: c.textMuted };
    case 'senior':
    case 'lead':
      return { bg: 'rgba(255,193,7,0.07)', border: 'rgba(255,193,7,0.2)', text: '#ffc107' };
    case 'junior':
      return { bg: 'rgba(79,172,254,0.08)', border: 'rgba(79,172,254,0.2)', text: '#7ec8fd' };
    case 'startup':
    case 'scaleup':
      return { bg: 'rgba(255,107,53,0.07)', border: 'rgba(255,107,53,0.2)', text: '#ff8c6b' };
    default:
      return c.isDark
        ? { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.6)' }
        : { bg: c.cardBg, border: c.cardBorder, text: c.textMuted };
  }
}

interface Props {
  label: string;
  variant?: TagVariant;
  matched?: boolean;
}

export default function TagBadge({ label, variant, matched }: Props) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (matched === true) {
    return (
      <View style={styles.tagMatched}>
        <Text style={styles.textMatched}>{label}</Text>
      </View>
    );
  }

  if (matched === false) {
    return (
      <View style={styles.tagMissing}>
        <Text style={styles.textMissing}>{label}</Text>
      </View>
    );
  }

  const s = resolveStyle(variant, colors);
  return (
    <View style={[styles.tag, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.text, { color: s.text }]}>{label}</Text>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    tag: {
      paddingHorizontal: SPACING.sm + 4,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADII.full,
      borderWidth: 1,
    },
    text: {
      fontSize: FONT_SIZES.xs,
      fontWeight: '500',
    },
    tagMatched: {
      paddingHorizontal: SPACING.sm + 4,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADII.full,
      borderWidth: 1.5,
      borderStyle: 'solid',
      borderColor: c.text,
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.07)' : 'rgba(5,22,80,0.07)',
    },
    textMatched: {
      fontSize: FONT_SIZES.xs,
      fontWeight: '700',
      color: c.text,
    },
    tagMissing: {
      paddingHorizontal: SPACING.sm + 4,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADII.full,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.cardBorder,
      backgroundColor: 'transparent',
    },
    textMissing: {
      fontSize: FONT_SIZES.xs,
      fontWeight: '400',
      color: c.textDim,
    },
  });
}
