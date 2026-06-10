import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface ScoreSelectorProps {
  value: number;
  onChange: (score: number) => void;
}

export default function ScoreSelector({ value, onChange }: ScoreSelectorProps) {
  const colors = useTheme();
  const styles = makeStyles(colors);

  const OPTIONS = [
    { value: 0,  label: 'Tümü' },
    { value: 40, label: '≥40%' },
    { value: 60, label: '≥60%' },
    { value: 80, label: '≥80%' },
  ] as const;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Minimum Eşleşme Skoru</Text>
      <View style={styles.chipRow}>
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.scoreChip, active && styles.scoreChipActive]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.scoreChipText, active && styles.scoreChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    chipRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    scoreChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: SPACING.sm + 2,
      borderRadius: RADII.md,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    scoreChipActive: {
      backgroundColor: `${colors.accent}22`,
      borderColor: `${colors.accent}66`,
    },
    scoreChipText: {
      color: colors.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
    scoreChipTextActive: {
      color: colors.accentLight,
    },
  });
