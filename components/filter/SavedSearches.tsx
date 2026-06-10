import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SavedSearch, searchLabel } from '@/store/searchStore';
import { FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors } from '@/constants/theme';

interface SavedSearchesProps {
  savedSearches: SavedSearch[];
  onLoadSaved: (s: SavedSearch) => void;
  onRemoveSearch: (id: string) => void;
}

export default function SavedSearches({
  savedSearches,
  onLoadSaved,
  onRemoveSearch,
}: SavedSearchesProps) {
  const colors = useTheme();
  const styles = makeStyles(colors);

  if (savedSearches.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Kayıtlı Aramalar</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.savedRow}>
          {savedSearches.map((s) => (
            <View key={s.id} style={styles.savedChip}>
              <TouchableOpacity onPress={() => onLoadSaved(s)} style={styles.savedChipText}>
                <Text style={styles.savedLabel} numberOfLines={1}>
                  {searchLabel(s)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onRemoveSearch(s.id)} style={styles.savedRemove}>
                <Text style={styles.savedRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
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
    savedRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      paddingVertical: 2,
    },
    savedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: RADII.full,
      paddingLeft: SPACING.sm + 4,
      paddingRight: SPACING.xs,
      paddingVertical: SPACING.xs + 2,
      gap: 4,
    },
    savedChipText: {
      maxWidth: 160,
    },
    savedLabel: {
      color: colors.text,
      fontSize: FONT_SIZES.xs,
      fontWeight: '500',
    },
    savedRemove: {
      padding: 4,
    },
    savedRemoveText: {
      color: colors.textDim,
      fontSize: 10,
    },
  });
