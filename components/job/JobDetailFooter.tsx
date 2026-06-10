import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';

interface Props {
  applied: boolean;
  colors: ThemeColors;
  insets: { bottom: number };
  onApply: () => void;
}

export default function JobDetailFooter({
  applied,
  colors,
  insets,
  onApply,
}: Props) {
  const styles = makeStyles(colors);

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
      <TouchableOpacity
        style={[styles.applyBtn, applied && styles.applyBtnApplied]}
        onPress={onApply}
        activeOpacity={0.85}
      >
        {applied ? (
          <Text style={[styles.applyText, styles.applyTextApplied]}>Başvuruldu ✓</Text>
        ) : (
          <View style={styles.applyInner}>
            <Text style={styles.applyText}>Hemen Başvur</Text>
            <Ionicons name="open-outline" size={18} color="#ffffff" style={styles.applyIcon} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    footer: {
      padding: SPACING.lg,
      paddingTop: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      backgroundColor: colors.bg,
    },
    applyBtn: {
      borderRadius: RADII.md,
      backgroundColor: colors.isDark ? colors.bgDeep : colors.accent,
      borderWidth: colors.isDark ? 1 : 0,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
    },
    applyBtnApplied: {
      backgroundColor: 'rgba(46,204,113,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(46,204,113,0.4)',
    },
    applyInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    applyText: {
      color: '#ffffff',
      fontSize: FONT_SIZES.md,
      fontWeight: '700',
    },
    applyIcon: {
      opacity: 0.85,
    },
    applyTextApplied: {
      color: '#2ecc71',
    },
  });
}
