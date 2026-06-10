import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';

interface RecentSearchesDropdownProps {
  recentSearches: string[];
  onSelect: (kw: string) => void;
  onClear: () => void;
}

export default function RecentSearchesDropdown({
  recentSearches,
  onSelect,
  onClear,
}: RecentSearchesDropdownProps) {
  const colors = useTheme();
  const styles = makeStyles(colors);

  if (recentSearches.length === 0) return null;

  return (
    <View style={styles.recentDropdown}>
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Son Aramalar</Text>
        <TouchableOpacity onPress={onClear} activeOpacity={0.7}>
          <Text style={styles.recentClear}>Temizle</Text>
        </TouchableOpacity>
      </View>
      {recentSearches.map((kw) => (
        <TouchableOpacity
          key={kw}
          style={styles.recentItem}
          onPress={() => onSelect(kw)}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={14} color={colors.textDim} />
          <Text style={styles.recentItemText}>{kw}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    recentDropdown: {
      marginHorizontal: SPACING.lg,
      marginTop: -SPACING.xs,
      backgroundColor: colors.bgDeep,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: RADII.lg,
      overflow: 'hidden',
      zIndex: 100,
      shadowColor: colors.isDark ? '#000000' : '#051650',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: colors.isDark ? 0.4 : 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    recentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    recentTitle: {
      color: colors.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    recentClear: {
      color: colors.text,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.isDark ? 'rgba(255,255,255,0.04)' : '#f0f2f7',
    },
    recentItemText: {
      color: colors.text,
      fontSize: FONT_SIZES.sm,
    },
  });
