import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_SIZES, GRADIENTS, RADII, SPACING } from '@/constants/theme';

interface Props {
  accentIndex: number;
  isSaved: boolean;
  isApplied: boolean;
  onPass: () => void;
  onSave: () => void;
  onApply: () => void;
}

export default function ActionButtons({ accentIndex, isSaved, isApplied, onPass, onSave, onApply }: Props) {
  const gradient = GRADIENTS[accentIndex % GRADIENTS.length];

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.iconBtn} onPress={onPass} activeOpacity={0.7}>
        <Text style={styles.passIcon}>✕</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.iconBtn, isSaved && styles.savedBtn]}
        onPress={onSave}
        activeOpacity={0.7}
      >
        <Text style={styles.saveIcon}>🔖</Text>
      </TouchableOpacity>

      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.applyGradient}>
        <TouchableOpacity style={styles.applyInner} onPress={onApply} activeOpacity={0.8}>
          <Text style={styles.applyText}>{isApplied ? 'Başvuruldu ✓' : 'Başvur →'}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm + 4,
    marginTop: 'auto',
  },
  iconBtn: {
    width: 56,
    height: 56,
    borderRadius: RADII.md,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedBtn: {
    backgroundColor: 'rgba(255,193,7,0.12)',
    borderColor: 'rgba(255,193,7,0.3)',
  },
  passIcon: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  saveIcon: {
    fontSize: 20,
  },
  applyGradient: {
    flex: 1,
    borderRadius: RADII.md,
    height: 56,
  },
  applyInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
