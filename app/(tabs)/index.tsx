import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  FlatList,
  Keyboard,
  LayoutAnimation,
  ListRenderItemInfo,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Job } from '@/types';
import { useFeedStore } from '@/store/feedStore';
import { useUserStore } from '@/store/userStore';
import { useSearchStore } from '@/store/searchStore';
import { useAuthStore } from '@/store/authStore';
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
  ThemeColors,
} from '@/constants/theme';

// ─── Subcomponents ────────────────────────────────────────────────────────────
import SearchBarGroup from '@/components/feed/SearchBarGroup';
import SwipeHint from '@/components/feed/SwipeHint';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const colors = useTheme();
  const { bg, text, textDim, textMuted, accent, headerBtnBg, cardBorder, bgDeep, isDark } = colors;

  const { jobs, setJobs, appendJobs, updateJobs, isLoading, setLoading, setCurrentIndex } =
    useFeedStore();
  const { profile } = useUserStore();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useSearchStore();
  const sessionUserId = useAuthStore((s) => s.session?.user.id);

  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [showSearchBars, setShowSearchBars] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showLocationToast, setShowLocationToast] = useState(false);
  const hintFade = useRef(new Animated.Value(0)).current;
  const hintBounce = useRef(new Animated.Value(0)).current;
  const locationToastAnim = useRef(new Animated.Value(0)).current;
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
  const locationInputRef = useRef<TextInput>(null);
  const loadingMoreRef = useRef(false);
  const bgRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgRefreshRetries = useRef(0);
  const BG_MAX_RETRIES = 10;

  const pageRef = useRef(1);
  const filtersRef = useRef(filters);
  const hasMoreRef = useRef(true);
  const sectorsRef = useRef(profile.preferences.sectors);
  const lastForegroundAt = useRef<number>(Date.now());
  const locationInitializedRef = useRef(!!profile.preferences.location);
  const hintShownRef = useRef(false);

  const SEARCH_BAR_HEIGHT = showSearchBars ? 148 : 0;
  const cardHeight =
    height - insets.top - HEADER_HEIGHT - SEARCH_BAR_HEIGHT - BOTTOM_NAV_HEIGHT - insets.bottom;

  const styles = useMemo(
    () =>
      makeStyles({
        bg,
        text,
        textDim,
        textMuted,
        accent,
        headerBtnBg,
        cardBorder,
        bgDeep,
        isDark,
        bottomNavH: BOTTOM_NAV_HEIGHT,
      }),
    [bg, text, textDim, textMuted, accent, headerBtnBg, cardBorder, bgDeep, isDark]
  );

  useEffect(() => {
    if (jobs.length > 0) return;
    loadInitialFeed(filters, 1);
  }, []);

  useEffect(() => {
    sectorsRef.current = profile.preferences.sectors;
  }, [profile.preferences.sectors]);

  useEffect(() => {
    const loc = profile.preferences.location;
    if (loc && !locationInitializedRef.current) {
      locationInitializedRef.current = true;
      setFilters((f) => {
        if (f.location === 'Istanbul, Turkey') {
          return { ...f, location: loc };
        }
        return f;
      });
      setLocationText((t) => (t === 'Istanbul, Turkey' ? loc : t));
    }
  }, [profile.preferences.location]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const elapsed = Date.now() - lastForegroundAt.current;
        if (elapsed > 5 * 60 * 1000) {
          loadInitialFeed(filtersRef.current, 1);
        }
        lastForegroundAt.current = Date.now();
      } else if (state === 'background') {
        lastForegroundAt.current = Date.now();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    hintShownRef.current = false;
  }, [sessionUserId]);

  useEffect(() => {
    if (hintShownRef.current || isLoading || jobs.length === 0) return;
    hintShownRef.current = true;
    setShowHint(true);
    Animated.timing(hintFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(hintBounce, { toValue: 10, duration: 500, useNativeDriver: true }),
        Animated.timing(hintBounce, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      { iterations: 4 }
    );
    bounce.start();
    const t = setTimeout(() => {
      bounce.stop();
      Animated.timing(hintFade, { toValue: 0, duration: 500, useNativeDriver: true }).start(() =>
        setShowHint(false)
      );
    }, 2800);
    return () => {
      clearTimeout(t);
      bounce.stop();
    };
  }, [isLoading]);

  function normalizeLocation(loc: string): string {
    const trimmed = (loc || '').trim();
    if (!trimmed) return 'Istanbul, Turkey';
    const map: Record<string, string> = {
      'İstanbul': 'Istanbul, Turkey',
      'istanbul': 'Istanbul, Turkey',
      'İstanbul, Turkey': 'Istanbul, Turkey',
      'Ankara': 'Ankara, Turkey',
      'ankara': 'Ankara, Turkey',
      'Ankara, Turkey': 'Ankara, Turkey',
      'İzmir': 'Izmir, Turkey',
      'izmir': 'Izmir, Turkey',
      'İzmir, Turkey': 'Izmir, Turkey',
      'Bursa': 'Bursa, Turkey',
      'Antalya': 'Antalya, Turkey',
      'Remote': 'Remote',
      'remote': 'Remote',
      'Uzaktan': 'Remote',
    };
    return map[trimmed] ?? trimmed;
  }

  function buildParams(f: FilterState, pageNum: number) {
    const params: Record<string, string | number> = {
      page: pageNum,
      location: normalizeLocation(f.location),
      sectors: sectorsRef.current.join(','),
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
    prevIndexRef.current = 0;
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
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const { jobs: more, partial } = await api.feed(buildParams(filtersRef.current, nextPage));
      if (more.length > 0) {
        pageRef.current = nextPage;
        setPage(nextPage);
        appendJobs(more);
        if (partial) {
          bgRefreshTimer.current = setTimeout(
            () => refreshInBackground(filtersRef.current, nextPage),
            2000
          );
        }
      } else if (!partial) {
        hasMoreRef.current = false;
      } else {
        setTimeout(() => {
          loadingMoreRef.current = false;
          setLoadingMore(false);
          loadMoreJobs();
        }, 2000);
        return;
      }
    } catch {
      // ağ hatası — hasMore'u sıfırlama, sonra tekrar denenebilir
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
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

  const defaultLocation = profile.preferences.location || 'Istanbul, Turkey';

  function handleLocationClear() {
    setLocationText(defaultLocation);
    applySearchAndLocation(searchText, defaultLocation);
    setShowLocationToast(true);
    Animated.sequence([
      Animated.timing(locationToastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(locationToastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowLocationToast(false));
  }

  function toggleSearch() {
    if (Platform.OS === 'ios') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setShowSearchBars((v) => !v);
  }

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Job>) => <JobCard job={item} cardHeight={cardHeight} />,
    [cardHeight]
  );

  const handleFlatListLayout = useCallback(() => {
    const idx = prevIndexRef.current;
    if (idx > 0 && idx < displayJobsCountRef.current) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0 });
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (bgRefreshTimer.current) clearTimeout(bgRefreshTimer.current);
    };
  }, []);

  const prevIndexRef = useRef(0);
  const jobsCountRef = useRef(jobs.length);
  useEffect(() => {
    jobsCountRef.current = jobs.length;
  }, [jobs.length]);

  const displayJobsCountRef = useRef(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems[0]) return;
      const idx: number = viewableItems[0].index ?? 0;
      setCurrentIndex(idx);
      if (displayJobsCountRef.current - idx <= 5) loadMoreJobs();
      prevIndexRef.current = idx;
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const displayJobs =
    filters.minScore > 0 ? jobs.filter((j) => (j.score ?? 0) >= filters.minScore) : jobs;
  displayJobsCountRef.current = displayJobs.length;

  const isFilterActive =
    filters.workType !== 'any' ||
    filters.seniority.length > 0 ||
    !!filters.keyword ||
    filters.minScore > 0;

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
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={styles.logo}>JobReel</Text>
          <Text style={{ fontSize: 16, lineHeight: 20 }}>🇹🇷</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIconBtn, showSearchBars && styles.headerIconBtnActive]}
            activeOpacity={0.7}
            onPress={toggleSearch}
            accessibilityRole="button"
            accessibilityLabel="Arama"
            accessibilityState={{ selected: showSearchBars }}
          >
            <Ionicons name="search-outline" size={18} color={showSearchBars ? '#ffffff' : text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, isFilterActive && styles.headerIconBtnActive]}
            activeOpacity={0.7}
            onPress={() => setShowFilter(true)}
            accessibilityRole="button"
            accessibilityLabel={isFilterActive ? 'Filtrele (aktif)' : 'Filtrele'}
          >
            <Ionicons name="options-outline" size={18} color={isFilterActive ? '#ffffff' : text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Arama çubukları */}
      {showSearchBars && (
        <SearchBarGroup
          searchText={searchText}
          setSearchText={setSearchText}
          locationText={locationText}
          setLocationText={setLocationText}
          defaultLocation={defaultLocation}
          onSearchSubmit={() => applySearchAndLocation(searchText, locationText)}
          onSearchClear={handleSearchClear}
          onLocationClear={handleLocationClear}
          showRecent={showRecent}
          setShowRecent={setShowRecent}
          recentSearches={recentSearches}
          onRecentSelect={handleRecentSelect}
          onRecentClear={clearRecentSearches}
          locationInputRef={locationInputRef}
        />
      )}

      <FilterSheet
        visible={showFilter}
        current={filters}
        onApply={handleApplyFilter}
        onClose={() => setShowFilter(false)}
      />

      {((isLoading && jobs.length > 0) || loadingMore) && (
        <View style={styles.filteringBanner}>
          <ActivityIndicator size="small" color={accent} />
          <Text style={styles.filteringText}>
            {loadingMore && !isLoading ? 'Daha fazla ilan yükleniyor...' : 'Yükleniyor...'}
          </Text>
        </View>
      )}

      <SwipeHint visible={showHint} fadeAnim={hintFade} bounceAnim={hintBounce} />

      {showLocationToast && (
        <Animated.View style={[styles.toast, { opacity: locationToastAnim }]} pointerEvents="none">
          <Text style={styles.toastText}>Konum varsayılana döndürüldü</Text>
        </Animated.View>
      )}
      <FlatList
        ref={listRef}
        data={displayJobs}
        renderItem={renderItem}
        extraData={cardHeight}
        onLayout={handleFlatListLayout}
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
            <Ionicons
              name={loadError ? 'warning-outline' : 'search-outline'}
              size={36}
              color={loadError ? '#ef4444' : textMuted}
            />
            <Text style={styles.emptyText}>
              {loadError ? 'Sunucuya ulaşılamadı' : 'İlan bulunamadı'}
            </Text>
            <Text style={styles.emptySubText}>
              {loadError
                ? 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.'
                : filters.minScore > 0
                ? `Eşleşme skoru filtresi (≥%${filters.minScore}) tüm ilanları gizliyor`
                : 'Filtre kriterlerini genişletmeyi dene'}
            </Text>
            {!loadError && filters.minScore > 0 ? (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => handleApplyFilter({ ...filters, minScore: 0 })}
              >
                <Text style={styles.retryText}>Skor Filtresini Kaldır</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.retryBtn} onPress={() => loadInitialFeed(filters)}>
                <Text style={styles.retryText}>Tekrar Dene</Text>
              </TouchableOpacity>
            )}
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
  bottomNavH: number;
}

function makeStyles({
  bg,
  text,
  textDim,
  textMuted,
  accent,
  headerBtnBg,
  cardBorder,
  bgDeep,
  isDark,
  bottomNavH,
}: StyleProps) {
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
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 6,
      elevation: 2,
    },
    headerIconBtnActive: {
      backgroundColor: accent,
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
      borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(5,22,80,0.1)',
    },
    filteringText: {
      color: text,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
    toast: {
      position: 'absolute',
      bottom: bottomNavH + 12,
      left: SPACING.lg,
      right: SPACING.lg,
      backgroundColor: isDark ? '#1a2540' : '#051650',
      borderRadius: RADII.full,
      paddingVertical: SPACING.sm + 2,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
      zIndex: 200,
    },
    toastText: {
      color: '#ffffff',
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
  });
}
