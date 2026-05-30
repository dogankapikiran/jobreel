import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { FONT_SIZES, RADII, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  isApplied: boolean;
  onApply: () => void;
  onExplore: () => void;
}

export default function ActionButtons({ isApplied, onApply, onExplore }: Props) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={[styles.applyBtn, isApplied && styles.applyBtnApplied]}
      onPress={onApply}
      activeOpacity={0.8}
    >
      <Text style={[styles.applyText, isApplied && styles.applyTextApplied]}>
        {isApplied ? 'Başvuruldu ✓' : 'Başvur →'}
      </Text>
    </TouchableOpacity>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    applyBtn: {
      borderRadius: RADII.md,
      backgroundColor: c.isDark ? '#1a2540' : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
    },
    applyBtnApplied: {
      backgroundColor: 'rgba(46,204,113,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(46,204,113,0.4)',
    },
    applyText: {
      color: c.isDark ? c.text : '#ffffff',
      fontSize: FONT_SIZES.md,
      fontWeight: '700',
    },
    applyTextApplied: {
      color: '#2ecc71',
    },
  });
}
