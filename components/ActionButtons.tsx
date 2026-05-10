import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT_SIZES, RADII, SPACING } from '@/constants/theme';

interface Props {
  isApplied: boolean;
  onApply: () => void;
  onExplore: () => void;
}

export default function ActionButtons({ isApplied, onApply, onExplore }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.detayBtn} onPress={onExplore} activeOpacity={0.8}>
        <Text style={styles.detayText}>Detay</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.applyBtn, isApplied && styles.applyBtnApplied]}
        onPress={onApply}
        activeOpacity={0.8}
      >
        <Text style={[styles.applyText, isApplied && styles.applyTextApplied]}>
          {isApplied ? 'Başvuruldu ✓' : 'Başvur →'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'stretch',
  },
  detayBtn: {
    flex: 1,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  detayText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1.4,
    borderRadius: RADII.md,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  applyBtnApplied: {
    backgroundColor: 'rgba(46,204,113,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(46,204,113,0.4)',
  },
  applyText: {
    color: '#0d0d14',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  applyTextApplied: {
    color: '#4ade80',
  },
});
