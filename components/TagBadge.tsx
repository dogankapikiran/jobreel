import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZES, RADII, SPACING } from '@/constants/theme';

type TagVariant = 'remote' | 'hybrid' | 'office' | 'senior' | 'lead' | 'junior' | 'mid' | 'startup' | 'scaleup' | string;

interface TagStyle {
  bg: string;
  border: string;
  text: string;
}

function resolveStyle(variant?: TagVariant): TagStyle {
  switch (variant) {
    case 'remote':
      return { bg: 'rgba(79,172,254,0.08)', border: 'rgba(79,172,254,0.2)', text: '#7ec8fd' };
    case 'hybrid':
      return { bg: 'rgba(46,204,113,0.07)', border: 'rgba(46,204,113,0.2)', text: '#5ddb8f' };
    case 'office':
      return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.6)' };
    case 'senior':
    case 'lead':
      return { bg: 'rgba(255,193,7,0.07)', border: 'rgba(255,193,7,0.2)', text: '#ffc107' };
    case 'junior':
      return { bg: 'rgba(79,172,254,0.08)', border: 'rgba(79,172,254,0.2)', text: '#7ec8fd' };
    case 'startup':
    case 'scaleup':
      return { bg: 'rgba(255,107,53,0.07)', border: 'rgba(255,107,53,0.2)', text: '#ff8c6b' };
    default:
      return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.6)' };
  }
}

interface Props {
  label: string;
  variant?: TagVariant;
}

export default function TagBadge({ label, variant }: Props) {
  const s = resolveStyle(variant);
  return (
    <View style={[styles.tag, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.text, { color: s.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.sm,
    borderWidth: 1,
  },
  text: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
});
