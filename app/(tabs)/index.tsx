import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Job } from '@/types';
import { useFeedStore } from '@/store/feedStore';
import { useUserStore } from '@/store/userStore';
import { api } from '@/services/api';
import JobCard from '@/components/JobCard';
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

  const { jobs, setJobs, appendJobs, isLoading, setLoading, currentIndex, setCurrentIndex } =
    useFeedStore();
  const { profile } = useUserStore();

  const [page, setPage] = useState(1);
  const listRef = useRef<FlatList<Job>>(null);
  const loadingMoreRef = useRef(false);

  const cardHeight = height - insets.top - HEADER_HEIGHT - BOTTOM_NAV_HEIGHT - insets.bottom;

  useEffect(() => {
    loadInitialFeed();
  }, []);

  async function loadInitialFeed() {
    setLoading(true);
    try {
      const { jobs: feed } = await api.feed({ location: profile.preferences.location || 'istanbul' });
      setJobs(feed);
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreJobs() {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      const nextPage = page + 1;
      setPage(nextPage);
      const { jobs: more } = await api.feed({
        page: nextPage,
        location: profile.preferences.location || 'istanbul',
      });
      appendJobs(more);
    } finally {
      loadingMoreRef.current = false;
    }
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

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (!viewableItems[0]) return;
      const idx: number = viewableItems[0].index ?? 0;
      setCurrentIndex(idx);
      if (jobs.length - idx <= 5) loadMoreJobs();
    },
    [jobs.length]
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const visibleDots = Math.min(jobs.length, 8);

  if (isLoading && jobs.length === 0) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>İlanlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          Job<Text style={styles.logoAccent}>Reel</Text>
        </Text>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
          <Text style={styles.filterText}>🎯 Filtrele</Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      {visibleDots > 0 && (
        <View style={[styles.dots, { top: insets.top + HEADER_HEIGHT + 10 }]}>
          {Array.from({ length: visibleDots }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex % visibleDots && styles.dotActive]}
            />
          ))}
        </View>
      )}

      {/* Feed */}
      <FlatList
        ref={listRef}
        data={jobs}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({
          length: cardHeight,
          offset: cardHeight * index,
          index,
        })}
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
            <Text style={styles.emptyText}>İlan bulunamadı</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadInitialFeed}>
              <Text style={styles.retryText}>Yenile</Text>
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
    backgroundColor: COLORS.bg,
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
    backgroundColor: COLORS.bg,
  },
  logo: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: COLORS.accent,
  },
  filterBtn: {
    backgroundColor: COLORS.headerBtnBg,
    borderWidth: 1,
    borderColor: COLORS.headerBtnBorder,
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.sm + 6,
    paddingVertical: SPACING.xs + 2,
  },
  filterText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZES.sm,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    height: 20,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
  },
  retryBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
});
