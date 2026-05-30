import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  ListRenderItemInfo,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Job } from '@/types';
import { useFeedStore } from '@/store/feedStore';
import { useUserStore } from '@/store/userStore';
import { useSearchStore } from '@/store/searchStore';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import JobCard from '@/components/JobCard';
import SkeletonCard from '@/components/SkeletonCard';
import FilterSheet, { FilterState } from '@/components/FilterSheet';
import {
  BOTTOM_NAV_HEIGHT,
  FONT_SIZES,
  HEADER_HEIGHT,
  RADII,
  SPACING,
} from '@/constants/theme';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const colors = useTheme();
  const { bg, text, textDim, textMuted, accent, headerBtnBg, cardBorder, bgDeep, isDark } = colors;

  const { jobs, setJobs, appendJobs, updateJobs, isLoading, setLoading, setCurrentIndex } =
    useFeedStore();
  const { profile } = useUserStore();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useSearchStore();

  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [showSearchBars, setShowSearchBars] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    location: profile.preferences.location || 'Istanbul, Turkey',
    workType: 'any',
    seniority: [],
    minScore: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [locationText, setLocationText] = useState(profile.preferences.location || 'Istanbul, Turkey');
  const listRef = useRef<FlatList<Job>>(null);
  const loadingMoreRef = useRef(false);
  const bgRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgRefreshRetries = useRef(0);
  const BG_MAX_RETRIES = 10;
  // Refs for stale-closure-safe access inside onViewableItemsChanged
  const pageRef = useRef(1);
  const filtersRef = useRef(filters);
  const hasMoreRef = useRef(true);

  const SEARCH_BAR_HEIGHT = showSearchBars ? 100 : 0;
  const cardHeight = height - insets.top - HEADER_HEIGHT - SEARCH_BAR_HEIGHT - BOTTOM_NAV_HEIGHT - insets.bottom;

  const styles = useMemo(() => makeStyles({ bg, text, textDim, textMuted, accent, headerBtnBg, cardBorder, bgDeep, isDark }), [bg, text, textDim, textMuted, accent, headerBtnBg, cardBorder, bgDeep, isDark]);

  useEffect(() => {
    if (jobs.length > 0) return;
    loadInitialFeed(filters, 1);
  }, []);

  function normalizeLocation(loc: string): string {
    const trimmed = (loc || '').trim();
    if (!trimmed) return 'Istanbul, Turkey';
    const map: Record<string, string> = {
      'İstanbul': 'Istanbul, Turkey',
      'istanbul': 'Istanbul, Turkey',
      'Ankara': 'Ankara, Turkey',
      'ankara': 'Ankara, Turkey',
      'İzmir': 'Izmir, Turkey',
      'izmir': 'Izmir, Turkey',
    };
    return map[trimmed] ?? trimmed;
  }

  function buildParams(f: FilterState, pageNum: number) {
    const { sectors } = profile.preferences;
    const params: Record<string, string | number> = {
      page: pageNum,
      location: normalizeLocation(f.location),
      sectors: sectors.join(','),
      work_type: f.workType,
      seniority: f.seniority.join(','),
    };
    if (f.keyword) params.keyword = f.keyword;
    return params;
  }

  async function refreshInBackground(f: FilterState, pageNum: number) {
    if (bgRefreshRetries.current >= BG_MAX_RETRIES) return;
    bgRefreshRetries.current += 1;
    try {
      const { jobs: enriched, partial } = await api.feed(buildParams(f, pageNum));
      if (enriched.length > 0) updateJobs(enriched);
      if (partial) {
        bgRefreshTimer.current = setTimeout(() => refreshInBackground(f, pageNum), 3000);
      }
    } catch {}
  }

  async function loadInitialFeed(f: FilterState, pageNum = 1) {
    if (bgRefreshTimer.current) clearTimeout(bgRefreshTimer.current);
    bgRefreshRetries.current = 0;
    pageRef.current = 1;
    filtersRef.current = f;
    hasMoreRef.current = true;
    setLoading(true);
    setLoadError(false);
    setPage(1);
    try {
      const { jobs: feed, partial } = await api.feed(buildParams(f, pageNum));
      setJobs(feed);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      if (partial) {
        bgRefreshTimer.current = setTimeout(() => refreshInBackground(f, pageNum), 2000);
      }
    } catch (e) {
      console.error('[Feed] API hatası:', e);
      setLoadError(true);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadInitialFeed(filters, 1);
    setIsRefreshing(false);
  }

  async function loadMoreJobs() {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      const nextPage = pageRef.current + 1;
      const { jobs: more } = await api.feed(buildParams(filtersRef.current, nextPage));
      if (more.length > 0) {
        pageRef.current = nextPage;
        setPage(nextPage);
        appendJobs(more);
      } else {
        hasMoreRef.current = false;
      }
    } catch {
      // ağ hatası — hasMore'u sıfırlama, sonra tekrar denenebilir
    } finally {
      loadingMoreRef.current = false;
    }
  }

  function handleApplyFilter(newFilters: FilterState) {
    filtersRef.current = newFilters;
    setFilters(newFilters);
    setSearchText(newFilters.keyword);
    setLocationText(newFilters.location);
    loadInitialFeed(newFilters, 1);
  }

  function applySearchAndLocation(kw: string, loc: string) {
    Keyboard.dismiss();
    setShowRecent(false);
    if (kw.trim()) addRecentSearch(kw.trim());
    const newFilters = { ...filters, keyword: kw, location: loc };
    filtersRef.current = newFilters;
    setFilters(newFilters);
    loadInitialFeed(newFilters, 1);
  }

  function handleRecentSelect(kw: string) {
    setSearchText(kw);
    applySearchAndLocation(kw, locationText);
  }

  function handleSearchClear() {
    setSearchText('');
    applySearchAndLocation('', locationText);
  }

  function handleLocationClear() {
    const defaultLoc = 'Istanbul, Turkey';
    setLocationText(defaultLoc);
    applySearchAndLocation(searchText, defaultLoc);
  }

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Job>) => (
      <JobCard
        job={item}
        cardHeight={cardHeight}
        onNext={() => listRef.current?.scrollToIndex({ index: index + 1, animated: true })}
      />
    ),
    [cardHeight]
  );

  const prevIndexRef = useRef(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (!viewableItems[0]) return;
      const idx: number = viewableItems[0].index ?? 0;
      setCurrentIndex(idx);
      if (jobs.length - idx <= 5) loadMoreJobs();
      prevIndexRef.current = idx;
    },
    [jobs.length]
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const displayJobs = filters.minScore > 0
    ? jobs.filter((j) => (j.score ?? 0) >= filters.minScore)
    : jobs;

  const isFilterActive = filters.workType !== 'any' || filters.seniority.length > 0 || !!filters.keyword || filters.minScore > 0;

  if (isLoading && jobs.length === 0) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <SkeletonCard cardHeight={cardHeight} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        >
          <Text style={styles.logo}>JobReel</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIconBtn, showSearchBars && styles.headerIconBtnActive]}
            activeOpacity={0.7}
            onPress={() => setShowSearchBars((v) => !v)}
          >
            <Ionicons name="search-outline" size={18} color={showSearchBars ? '#ffffff' : text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, isFilterActive && styles.headerIconBtnActive]}
            activeOpacity={0.7}
            onPress={() => setShowFilter(true)}
          >
            <Ionicons name="options-outline" size={18} color={isFilterActive ? '#ffffff' : text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Arama çubukları */}
      {showSearchBars && (
        <View>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={15} color={textDim} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setShowRecent(recentSearches.length > 0)}
              onBlur={() => setTimeout(() => setShowRecent(false), 150)}
              onSubmitEditing={() => applySearchAndLocation(searchText, locationText)}
              placeholder="Pozisyon veya şirket ara..."
              placeholderTextColor={textDim}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={handleSearchClear} style={styles.searchClearBtn} activeOpacity={0.7}>
                <Ionicons name="close-outline" size={16} color={textDim} />
              </TouchableOpacity>
            )}
          </View>

          {showRecent && (
            <View style={styles.recentDropdown}>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>Son Aramalar</Text>
                <TouchableOpacity onPress={() => { clearRecentSearches(); setShowRecent(false); }} activeOpacity={0.7}>
                  <Text style={styles.recentClear}>Temizle</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((kw) => (
                <TouchableOpacity key={kw} style={styles.recentItem} onPress={() => handleRecentSelect(kw)} activeOpacity={0.7}>
                  <Ionicons name="time-outline" size={14} color={textDim} />
                  <Text style={styles.recentItemText}>{kw}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.searchRow}>
            <Ionicons name="location-outline" size={15} color={textDim} />
            <TextInput
              style={styles.searchInput}
              value={locationText}
              onChangeText={setLocationText}
              onSubmitEditing={() => applySearchAndLocation(searchText, locationText)}
              placeholder="İstanbul, Ankara, Remote..."
              placeholderTextColor={textDim}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="words"
            />
            {locationText !== 'Istanbul, Turkey' && (
              <TouchableOpacity onPress={handleLocationClear} style={styles.searchClearBtn} activeOpacity={0.7}>
                <Ionicons name="close-outline" size={16} color={textDim} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <FilterSheet
        visible={showFilter}
        current={filters}
        onApply={handleApplyFilter}
        onClose={() => setShowFilter(false)}
      />

      {isLoading && jobs.length > 0 && (
        <View style={styles.filteringBanner}>
          <ActivityIndicator size="small" color={accent} />
          <Text style={styles.filteringText}>Yükleniyor...</Text>
        </View>
      )}

      <FlatList
        key={cardHeight}
        ref={listRef}
        data={displayJobs}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({
          length: cardHeight,
          offset: cardHeight * index,
          index,
        })}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={accent}
            colors={[accent]}
          />
        }
        pagingEnabled
        snapToInterval={cardHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={[styles.center, { height: cardHeight }]}>
            <Text style={styles.emptyText}>
              {loadError ? '⚠️ Sunucuya ulaşılamadı' : 'İlan bulunamadı'}
            </Text>
            <Text style={styles.emptySubText}>
              {loadError
                ? 'Backend çalışıyor mu? IP doğru mu?'
                : 'Filtre kriterlerini genişletmeyi dene'}
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadInitialFeed(filters)}>
              <Text style={styles.retryText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

interface StyleProps {
  bg: string;
  text: string;
  textDim: string;
  textMuted: string;
  accent: string;
  headerBtnBg: string;
  cardBorder: string;
  bgDeep: string;
  isDark: boolean;
}

function makeStyles({ bg, text, textDim, textMuted, accent, headerBtnBg, cardBorder, bgDeep, isDark }: StyleProps) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: bg,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.md,
    },
    header: {
      height: HEADER_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      backgroundColor: bg,
    },
    logo: {
      color: text,
      fontSize: FONT_SIZES.xl,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    headerIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: headerBtnBg,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: isDark ? '#000000' : '#051650',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.30 : 0.10,
      shadowRadius: 6,
      elevation: 2,
    },
    headerIconBtnActive: {
      backgroundColor: accent,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.sm,
      height: 44,
      backgroundColor: bgDeep,
      borderWidth: isDark ? 1 : 0,
      borderColor: cardBorder,
      borderRadius: 12,
      paddingHorizontal: SPACING.md,
      gap: SPACING.sm,
      shadowColor: isDark ? '#000000' : '#051650',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.30 : 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      color: text,
      fontSize: FONT_SIZES.sm,
      height: '100%',
    },
    searchClearBtn: {
      padding: 4,
    },
    emptyText: {
      color: text,
      fontSize: FONT_SIZES.md,
    },
    emptySubText: {
      color: textMuted,
      fontSize: FONT_SIZES.xs,
      textAlign: 'center',
      maxWidth: 240,
    },
    retryBtn: {
      backgroundColor: accent,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderRadius: RADII.full,
    },
    retryText: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: FONT_SIZES.sm,
    },
    filteringBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.sm,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(5,22,80,0.06)',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(5,22,80,0.10)',
    },
    filteringText: {
      color: text,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
    recentDropdown: {
      marginHorizontal: SPACING.lg,
      marginTop: -SPACING.xs,
      backgroundColor: bgDeep,
      borderWidth: 1,
      borderColor: cardBorder,
      borderRadius: RADII.lg,
      overflow: 'hidden',
      zIndex: 100,
      shadowColor: isDark ? '#000000' : '#051650',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.40 : 0.08,
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
      borderBottomColor: cardBorder,
    },
    recentTitle: {
      color: textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    recentClear: {
      color: text,
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
      borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : '#f0f2f7',
    },
    recentItemText: {
      color: text,
      fontSize: FONT_SIZES.sm,
    },
  });
}
