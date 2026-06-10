import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';

interface Props {
  title: string;
  saved: boolean;
  colors: ThemeColors;
  onBack: () => void;
  onShare: () => void;
  onSave: () => void;
}

export default function JobDetailHeader({
  title,
  saved,
  colors,
  onBack,
  onShare,
  onSave,
}: Props) {
  const styles = makeStyles(colors);

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <TouchableOpacity onPress={onShare} style={styles.saveBtn}>
        <Ionicons name="share-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSave}
        style={[styles.saveBtn, saved && styles.saveBtnSaved]}
      >
        <Ionicons
          name={saved ? 'bookmark' : 'bookmark-outline'}
          size={18}
          color={saved ? '#f59e0b' : colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      gap: SPACING.md,
      backgroundColor: colors.bg,
    },
    closeBtn: {
      width: 36,
      height: 36,
      backgroundColor: colors.headerBtnBg,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    closeIcon: {
      color: colors.textMuted,
      fontSize: 14,
    },
    headerTitle: {
      flex: 1,
      color: colors.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
    },
    saveBtn: {
      width: 36,
      height: 36,
      borderRadius: RADII.full,
      backgroundColor: colors.bgDeep,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    saveBtnSaved: {
      backgroundColor: 'rgba(245,158,11,0.10)',
      borderColor: 'rgba(245,158,11,0.35)',
    },
  });
}
