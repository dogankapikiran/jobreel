import React, { useMemo, useState } from 'react';
import {
  Linking,
  SectionList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Job } from '@/types';
import { useFeedStore } from '@/store/feedStore';
import { timeAgo } from '@/services/api';
import { BOTTOM_NAV_HEIGHT, COLORS, FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import { brandColors } from '@/services/logoService';
import CompanyLogo from '@/components/CompanyLogo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function dateBucket(ts: number | undefined): string {
  if (!ts) return 'Daha Önce';
  const days = (Date.now() - ts) / 86_400_000;
  if (days < 1) return 'Bugün';
  if (days < 2) return 'Dün';
  const d = Math.floor(days);
  if (d < 7) return `${d} Gün Önce`;
  if (d < 14) return '1 Hafta Önce';
  return 'Daha Önce';
}

const BUCKET_ORDER = [
  'Bugün', 'Dün',
  '2 Gün Önce', '3 Gün Önce', '4 Gün Önce', '5 Gün Önce', '6 Gün Önce',
  '1 Hafta Önce', 'Daha Önce',
];

type FilterKey = 'Tümü' | 'Kapananlar';
const FILTERS: FilterKey[] = ['Tümü', 'Kapananlar'];

// ─── ApplicationCard ──────────────────────────────────────────────────────────

function ApplicationCard({ job }: { job: Job }) {
  const { gradient, accent } = brandColors(job.company);
  const isClosed = job.isClosed === true;

  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(job.url).catch(() => {})}
      activeOpacity={0.78}
      style={styles.card}
    >
      <LinearGradient
        colors={[hexAlpha(accent, 0.22), 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 0.9 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.cardRow}>
        <CompanyLogo company={job.company} gradient={gradient} size={44} borderRadius={12} />

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{job.title}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {job.company} · {job.location}
          </Text>
          <View style={styles.metaRow}>
            {isClosed ? (
              <View style={styles.pillClosed}>
                <View style={[styles.pillDot, { backgroundColor: '#5a5a7a' }]} />
                <Text style={[styles.pillText, { color: '#5a5a7a' }]}>İlan Kapalı</Text>
              </View>
            ) : (
              <View style={styles.pillApplied}>
                <View style={[styles.pillDot, { backgroundColor: '#86efac' }]} />
                <Text style={[styles.pillText, { color: '#2ecc71' }]}>Başvuruldu</Text>
              </View>
            )}
            <View style={styles.metaSep} />
            <Text style={styles.metaTag}>{timeAgo(job.postedAt)}</Text>
          </View>
        </View>

        <View style={styles.detailBtn}>
          <Text style={styles.detailText}>Detay →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── DateGroupHeader ──────────────────────────────────────────────────────────

function DateGroupHeader({ title }: { title: string }) {
  return (
    <View style={styles.groupHeader}>
      <Text style={styles.groupLabel}>{title.toUpperCase()}</Text>
      <View style={styles.groupLine} />
    </View>
  );
}

// ─── ApplicationsScreen ───────────────────────────────────────────────────────

export default function ApplicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appliedJobs, appliedTimestamps } = useFeedStore();

  const [activeFilter, setActiveFilter] = useState<FilterKey>('Tümü');

  const validJobs = useMemo(
    () => appliedJobs.filter(
      (item) => item && typeof item === 'object' && typeof item.company === 'string'
    ),
    [appliedJobs]
  );

  const sections = useMemo(() => {
    const filtered = activeFilter === 'Kapananlar'
      ? validJobs.filter(j => j.isClosed === true)
      : validJobs;
    const buckets = new Map<string, Job[]>();
    filtered.forEach(job => {
      const key = dateBucket(appliedTimestamps[job.id]);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(job);
    });
    return BUCKET_ORDER
      .filter(b => buckets.has(b))
      .map(b => ({ title: b, data: buckets.get(b)! }));
  }, [validJobs, appliedTimestamps, activeFilter]);

  const totalFiltered = sections.reduce((n, s) => n + s.data.length, 0);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Başvurularım</Text>
          <Text style={styles.headingCount}>{totalFiltered} başvuru</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <LinearGradient
            colors={['#7c6dfa', '#4facfe']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.emptyIcon}
          >
            <Ionicons name="briefcase" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>
            {activeFilter === 'Tümü' ? 'Henüz başvurmadın' : 'Kapanan ilan yok'}
          </Text>
          <Text style={styles.emptyDesc}>
            {activeFilter === 'Tümü'
              ? 'İlanları keşfet ve beğendiklerine başvur.'
              : 'Başvurduğun ilanların hiçbiri kapanmamış.'}
          </Text>
          {activeFilter === 'Tümü' ? (
            <TouchableOpacity
              onPress={() => router.push('/')}
              activeOpacity={0.8}
              style={styles.emptyCta}
            >
              <LinearGradient
                colors={['#7c6dfa', '#4facfe']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.emptyCtaGradient}
              >
                <Text style={styles.emptyCtaText}>İlanları Keşfet →</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setActiveFilter('Tümü')}
              activeOpacity={0.8}
              style={styles.emptyCta}
            >
              <LinearGradient
                colors={['#7c6dfa', '#4facfe']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.emptyCtaGradient}
              >
                <Text style={styles.emptyCtaText}>Tümünü Gör</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + SPACING.lg },
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <DateGroupHeader title={section.title} />
          )}
          renderItem={({ item }) => <ApplicationCard job={item} />}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  heading: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  headingCount: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  filterRow: {
    marginTop: 14,
    marginBottom: 2,
  },
  filterContent: {
    gap: SPACING.xs + 2,
    paddingBottom: 10,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterChipActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  filterText: {
    fontSize: FONT_SIZES.xs + 1,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: -0.1,
  },
  filterTextActive: {
    color: '#0a0b12',
  },

  // List
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
  },

  // Group header
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 2,
    paddingHorizontal: 4,
  },
  groupLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.4)',
  },
  groupLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Card
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    marginTop: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  cardSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11.5,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 9,
    flexWrap: 'wrap',
  },
  pillApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 6,
    paddingRight: 7,
    borderRadius: RADII.full,
    borderWidth: 1,
    backgroundColor: 'rgba(46,204,113,0.13)',
    borderColor: 'rgba(46,204,113,0.28)',
  },
  pillClosed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 6,
    paddingRight: 7,
    borderRadius: RADII.full,
    borderWidth: 1,
    backgroundColor: 'rgba(90,90,122,0.15)',
    borderColor: 'rgba(90,90,122,0.35)',
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  metaTag: {
    fontSize: 10.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
  },
  metaSep: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // Detail button
  detailBtn: {
    flexShrink: 0,
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 11,
    backgroundColor: 'rgba(124,109,250,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(124,109,250,0.28)',
  },
  detailText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a89cfc',
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm + 4,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: RADII.xl - 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  emptyCta: {
    borderRadius: RADII.full,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  emptyCtaGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
  },
  emptyCtaText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
});
