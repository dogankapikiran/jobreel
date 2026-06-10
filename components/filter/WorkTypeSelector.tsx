import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WorkType } from '@/types';
import { WORK_TYPES } from '@/constants/filterOptions';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface WorkTypeSelectorProps {
  value: WorkType | 'any';
  onChange: (wt: WorkType | 'any') => void;
}

export default function WorkTypeSelector({ value, onChange }: WorkTypeSelectorProps) {
  const colors = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Çalışma Tipi</Text>
      <View style={styles.chipRow}>
        {WORK_TYPES.map((wt) => {
          const active = value === wt.value;
          return (
            <TouchableOpacity
              key={wt.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(wt.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.chipIcon}>{wt.icon}</Text>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {wt.label}
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
    chip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: SPACING.sm + 2,
      borderRadius: RADII.md,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 4,
    },
    chipActive: {
      backgroundColor: `${colors.accent}22`,
      borderColor: `${colors.accent}66`,
    },
    chipIcon: {
      fontSize: 16,
    },
    chipText: {
      color: colors.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '500',
    },
    chipTextActive: {
      color: colors.accentLight,
    },
  });
