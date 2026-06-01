import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={onExplore}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="İlanı incele"
      >
        <Text style={styles.exploreText}>İncele</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.applyBtn, isApplied && styles.applyBtnApplied]}
        onPress={onApply}
        disabled={isApplied}
        activeOpacity={isApplied ? 1 : 0.8}
        accessibilityRole="button"
        accessibilityLabel={isApplied ? 'Başvuruldu' : 'Şirket sitesinde başvur'}
        accessibilityState={{ disabled: isApplied }}
      >
        {isApplied ? (
          <Text style={[styles.applyText, styles.applyTextApplied]}>Başvuruldu ✓</Text>
        ) : (
          <View style={styles.applyInner}>
            <Text style={styles.applyText}>Başvur</Text>
            <Ionicons name="open-outline" size={18} color="#ffffff" style={styles.applyIcon} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 8,
    },
    exploreBtn: {
      flex: 1,
      borderRadius: RADII.md,
      borderWidth: 1.5,
      borderColor: c.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
    },
    exploreText: {
      color: c.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
    },
    applyBtn: {
      flex: 1.6,
      borderRadius: RADII.md,
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.15)' : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: 'rgba(226,232,245,0.30)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
    },
    applyBtnApplied: {
      backgroundColor: 'rgba(46,204,113,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(46,204,113,0.35)',
    },
    applyInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
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
      color: '#1a9e52',
    },
  });
}
