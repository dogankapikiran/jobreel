import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import RecentSearchesDropdown from './RecentSearchesDropdown';

interface SearchBarGroupProps {
  searchText: string;
  setSearchText: (text: string) => void;
  locationText: string;
  setLocationText: (text: string) => void;
  defaultLocation: string;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  onLocationClear: () => void;
  showRecent: boolean;
  setShowRecent: (show: boolean) => void;
  recentSearches: string[];
  onRecentSelect: (kw: string) => void;
  onRecentClear: () => void;
  locationInputRef: React.RefObject<TextInput | null>;
}

export default function SearchBarGroup({
  searchText,
  setSearchText,
  locationText,
  setLocationText,
  defaultLocation,
  onSearchSubmit,
  onSearchClear,
  onLocationClear,
  showRecent,
  setShowRecent,
  recentSearches,
  onRecentSelect,
  onRecentClear,
  locationInputRef,
}: SearchBarGroupProps) {
  const colors = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={15} color={colors.textDim} />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          onFocus={() => setShowRecent(recentSearches.length > 0)}
          onBlur={() => setTimeout(() => setShowRecent(false), 150)}
          onSubmitEditing={() => locationInputRef.current?.focus()}
          placeholder="Pozisyon veya şirket ara..."
          placeholderTextColor={colors.textDim}
          returnKeyType="next"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={onSearchClear} style={styles.searchClearBtn} activeOpacity={0.7}>
            <Ionicons name="close-outline" size={16} color={colors.textDim} />
          </TouchableOpacity>
        )}
      </View>

      {showRecent && (
        <RecentSearchesDropdown
          recentSearches={recentSearches}
          onSelect={onRecentSelect}
          onClear={onRecentClear}
        />
      )}

      <View style={styles.searchRow}>
        <Ionicons name="location-outline" size={15} color={colors.textDim} />
        <TextInput
          ref={locationInputRef}
          style={styles.searchInput}
          value={locationText}
          onChangeText={setLocationText}
          onSubmitEditing={onSearchSubmit}
          placeholder="İstanbul, Ankara, Uzaktan..."
          placeholderTextColor={colors.textDim}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="words"
        />
        {locationText !== defaultLocation && locationText.length > 0 && (
          <TouchableOpacity
            onPress={onLocationClear}
            style={styles.searchClearBtn}
            activeOpacity={0.7}
            accessibilityLabel="Konumu varsayılana sıfırla"
          >
            <Ionicons name="arrow-undo-outline" size={15} color={colors.textDim} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.searchSubmitBtn}
        onPress={onSearchSubmit}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Aramayı uygula"
      >
        <Ionicons name="search" size={14} color="#ffffff" />
        <Text style={styles.searchSubmitText}>Ara</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 2,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.sm,
      height: 44,
      backgroundColor: colors.bgDeep,
      borderWidth: colors.isDark ? 1 : 0,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      paddingHorizontal: SPACING.md,
      gap: SPACING.sm,
      shadowColor: colors.isDark ? '#000000' : '#051650',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colors.isDark ? 0.3 : 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: FONT_SIZES.sm,
      height: '100%',
    },
    searchClearBtn: {
      padding: 4,
    },
    searchSubmitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.sm,
      height: 38,
      backgroundColor: colors.accent,
      borderRadius: RADII.full,
    },
    searchSubmitText: {
      color: '#ffffff',
      fontSize: FONT_SIZES.sm,
      fontWeight: '700',
    },
  });
