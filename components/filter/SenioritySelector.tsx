import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Seniority } from '@/types';
import { SENIORITY_OPTIONS } from '@/constants/filterOptions';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface SenioritySelectorProps {
  value: Seniority[];
  onChange: (seniority: Seniority[]) => void;
}

export default function SenioritySelector({ value, onChange }: SenioritySelectorProps) {
  const colors = useTheme();
  const styles = makeStyles(colors);

  function toggleSeniority(v: Seniority) {
    onChange(
      value.includes(v) ? value.filter((x) => x !== v) : [...value, v]
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Kıdem Seviyesi (Çoklu Seçim)</Text>
      <View style={styles.seniorityGrid}>
        {SENIORITY_OPTIONS.map((opt) => {
          const active = value.includes(opt.value);
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.seniorityCard, active && styles.seniorityCardActive]}
              onPress={() => toggleSeniority(opt.value)}
              activeOpacity={0.8}
            >
              {active && <Text style={styles.checkmark}>✓</Text>}
              <Text style={[styles.seniorityLabel, active && styles.seniorityLabelActive]}>
                {opt.label}
              </Text>
              <Text style={styles.seniorityDesc}>{opt.desc}</Text>
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
    seniorityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    seniorityCard: {
      width: '47%',
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: RADII.md,
      padding: SPACING.md,
      gap: 2,
    },
    seniorityCardActive: {
      backgroundColor: `${colors.accent}22`,
      borderColor: `${colors.accent}66`,
    },
    checkmark: {
      position: 'absolute',
      top: SPACING.sm,
      right: SPACING.sm,
      color: colors.accent,
      fontSize: 12,
      fontWeight: '800',
    },
    seniorityLabel: {
      color: colors.textMuted,
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
    },
    seniorityLabelActive: {
      color: colors.text,
    },
    seniorityDesc: {
      color: colors.textDim,
      fontSize: FONT_SIZES.xs,
    },
  });
