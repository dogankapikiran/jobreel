import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  COLORS,
  FONT_SIZES,
  HEADER_HEIGHT,
  RADII,
  SPACING,
} from '@/constants/theme';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { bg } = useTheme();

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

  const SEARCH_BAR_HEIGHT = showSearchBars ? 100 : 0;
  const cardHeight = height - insets.top - HEADER_HEIGHT - SEARCH_BAR_HEIGHT - BOTTOM_NAV_HEIGHT - insets.bottom;

  useEffect(() => {
    loadInitialFeed(filters, 1);
  }, []);

  function normalizeLocation(loc: string): string {
    const trimmed = (loc || '').trim();
    if (!trimmed) return 'Istanbul, Turkey';
    // Map common Turkish city names to English equivalents JobSpy understands
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
    // Kullanıcı manuel keyword girmişse gönder; yoksa backend profil+geçmişten kişiselleştirir
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
    setLoading(true);
    setLoadError(false);
    setPage(pageNum);
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
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      const nextPage = page + 1;
      setPage(nextPage);
      const { jobs: more } = await api.feed(buildParams(filters, nextPage));
      appendJobs(more);
    } finally {
      loadingMoreRef.current = false;
    }
  }

  function handleApplyFilter(newFilters: FilterState) {
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

  if (isLoading && jobs.length === 0) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: bg }]}>
        <SkeletonCard cardHeight={cardHeight} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: bg }]}>
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
            <Ionicons name="search-outline" size={18} color={showSearchBars ? '#ffffff' : '#051650'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, (filters.workType !== 'any' || filters.seniority.length > 0 || filters.keyword || filters.minScore > 0) && styles.headerIconBtnActive]}
            activeOpacity={0.7}
            onPress={() => setShowFilter(true)}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={(filters.workType !== 'any' || filters.seniority.length > 0 || filters.keyword || filters.minScore > 0) ? '#ffffff' : '#051650'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Arama çubukları — sadece toggle açıkken göster */}
      {showSearchBars && (
        <View>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={15} color={COLORS.textDim} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setShowRecent(recentSearches.length > 0)}
              onBlur={() => setTimeout(() => setShowRecent(false), 150)}
              onSubmitEditing={() => applySearchAndLocation(searchText, locationText)}
              placeholder="Pozisyon veya şirket ara..."
              placeholderTextColor={COLORS.textDim}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={handleSearchClear} style={styles.searchClearBtn} activeOpacity={0.7}>
                <Ionicons name="close-outline" size={16} color={COLORS.textDim} />
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
                  <Ionicons name="time-outline" size={14} color={COLORS.textDim} />
                  <Text style={styles.recentItemText}>{kw}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.searchRow}>
            <Ionicons name="location-outline" size={15} color={COLORS.textDim} />
            <TextInput
              style={styles.searchInput}
              value={locationText}
              onChangeText={setLocationText}
              onSubmitEditing={() => applySearchAndLocation(searchText, locationText)}
              placeholder="İstanbul, Ankara, Remote..."
              placeholderTextColor={COLORS.textDim}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="words"
            />
            {locationText !== 'Istanbul, Turkey' && (
              <TouchableOpacity onPress={handleLocationClear} style={styles.searchClearBtn} activeOpacity={0.7}>
                <Ionicons name="close-outline" size={16} color={COLORS.textDim} />
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
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.filteringText}>Yükleniyor...</Text>
        </View>
      )}

      {/* Feed */}
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
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef1f8',
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
    backgroundColor: '#eef1f8',
  },
  logo: {
    color: '#051650',
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
    backgroundColor: '#ffffff',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  headerIconBtnActive: {
    backgroundColor: '#051650',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    height: 44,
    backgroundColor: '#ffffff',
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: '#051650',
    fontSize: FONT_SIZES.sm,
    height: '100%',
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearText: {
    color: '#8a94a6',
    fontSize: 12,
  },
  dots: {
    position: 'absolute',
    right: 14,
    gap: 5,
    zIndex: 200,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(5,22,80,0.15)',
  },
  dotActive: {
    height: 20,
    backgroundColor: '#051650',
    borderRadius: 2,
  },
  loadingText: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.sm,
  },
  emptyText: {
    color: '#051650',
    fontSize: FONT_SIZES.md,
  },
  emptySubText: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    maxWidth: 240,
  },
  loadingSubText: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
  },
  retryBtn: {
    backgroundColor: '#051650',
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
    backgroundColor: 'rgba(5,22,80,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5,22,80,0.10)',
  },
  filteringText: {
    color: '#051650',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  recentDropdown: {
    marginHorizontal: SPACING.lg,
    marginTop: -SPACING.xs,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dde1ea',
    borderRadius: RADII.lg,
    overflow: 'hidden',
    zIndex: 100,
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
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
    borderBottomColor: '#dde1ea',
  },
  recentTitle: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentClear: {
    color: '#051650',
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
    borderBottomColor: '#f0f2f7',
  },
  recentItemText: {
    color: '#051650',
    fontSize: FONT_SIZES.sm,
  },
});
