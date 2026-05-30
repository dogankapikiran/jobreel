import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Job } from '@/types';
import { useFeedStore } from '@/store/feedStore';
import { api, timeAgo } from '@/services/api';
import { BOTTOM_NAV_HEIGHT, FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { brandColors } from '@/services/logoService';
import CompanyLogo from '@/components/CompanyLogo';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeOpenURL(url: string): void {
  try {
    const { protocol } = new URL(url);
    if (protocol !== 'https:' && protocol !== 'http:') return;
    Linking.openURL(url).catch(() => {});
  } catch { /* geçersiz URL */ }
}

function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function matchDotColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#84cc16';
  if (score >= 55) return '#f59e0b';
  return '#f97316';
}

function workModeLabel(wt: Job['workType']): string {
  switch (wt) {
    case 'remote': return 'Uzaktan';
    case 'hybrid': return 'Hibrit';
    case 'office': return 'Ofis';
    default: return '';
  }
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

type FilterKey = 'Tümü' | 'Hibrit' | 'Uzaktan' | 'Bu hafta';
const FILTERS: FilterKey[] = ['Tümü', 'Hibrit', 'Uzaktan', 'Bu hafta'];

function filterJobs(
  jobs: Job[],
  filter: FilterKey,
  timestamps: Record<string, number>,
): Job[] {
  switch (filter) {
    case 'Hibrit':   return jobs.filter(j => j.workType === 'hybrid');
    case 'Uzaktan':  return jobs.filter(j => j.workType === 'remote');
    case 'Bu hafta': {
      const weekAgo = Date.now() - 7 * 86_400_000;
      return jobs.filter(j => (timestamps[j.id] ?? 0) > weekAgo);
    }
    default: return jobs;
  }
}

// ─── SavedCard ────────────────────────────────────────────────────────────────

interface CardProps {
  job: Job;
  onRemove: () => void;
  onPress: () => void;
}

function SavedCard({ job, onRemove, onPress }: CardProps) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { accent } = brandColors(job.company);
  const score = job.score ?? 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78} style={styles.card}>
      {/* Subtle brand tint — top-right corner */}
      <LinearGradient
        colors={[hexAlpha(accent, 0.08), 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.cardRow}>
        {/* Logo */}
        <CompanyLogo
          company={job.company}
          size={44}
          borderRadius={12}
        />

        {/* Body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{job.title}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {job.company} · {job.location}
          </Text>
          <View style={styles.metaRow}>
            {score > 0 && (
              <View style={[styles.matchPill, {
                backgroundColor: hexAlpha(accent, 0.10),
                borderColor: hexAlpha(accent, 0.22),
              }]}>
                <View style={[styles.matchDot, { backgroundColor: matchDotColor(score) }]} />
                <Text style={[styles.matchText, { color: accent }]}>%{score}</Text>
              </View>
            )}
            {job.workType !== 'unknown' && (
              <Text style={styles.metaTag}>{workModeLabel(job.workType)}</Text>
            )}
            <View style={styles.metaSep} />
            <Text style={styles.metaTag}>{timeAgo(job.postedAt)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={onRemove}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={13} color={colors.textDim} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => safeOpenURL(job.url)}
            style={styles.applyBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.applyText}>Başvur</Text>
            <Ionicons name="arrow-forward" size={11} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── DateGroupHeader ──────────────────────────────────────────────────────────

function DateGroupHeader({ title }: { title: string }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.groupHeader}>
      <Text style={styles.groupLabel}>{title.toUpperCase()}</Text>
      <View style={styles.groupLine} />
    </View>
  );
}

// ─── UndoToast ────────────────────────────────────────────────────────────────

interface UndoToastProps {
  visible: boolean;
  onUndo: () => void;
  bottomOffset: number;
}

function UndoToast({ visible, onUndo, bottomOffset }: UndoToastProps) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [visible, anim]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.toast,
        { bottom: bottomOffset + BOTTOM_NAV_HEIGHT - 4 },
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      <Text style={styles.toastText}>Kaydedilenlerden kaldırıldı</Text>
      <TouchableOpacity onPress={onUndo} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.toastUndo}>Geri Al</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── SavedScreen ──────────────────────────────────────────────────────────────

export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { savedJobs, savedTimestamps, saveJob, unsaveJob } = useFeedStore();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('Tümü');
  const [undoJob, setUndoJob] = useState<Job | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => () => clearTimeout(undoTimer.current), []);

  async function refresh() {
    setLoading(true);
    try {
      const jobs = await api.getSaved();
      jobs.forEach(j => saveJob(j));
    } catch {
      // fall back to locally cached savedJobs
    } finally {
      setLoading(false);
    }
  }

  const handleRemove = useCallback((job: Job) => {
    if (undoJob) {
      clearTimeout(undoTimer.current);
      api.unsaveJob(undoJob.id).catch(() => {});
    }
    unsaveJob(job.id);
    setUndoJob(job);
    undoTimer.current = setTimeout(() => {
      api.unsaveJob(job.id).catch(() => {});
      setUndoJob(null);
    }, 3000);
  }, [undoJob, unsaveJob]);

  const handleUndo = useCallback(() => {
    if (!undoJob) return;
    clearTimeout(undoTimer.current);
    saveJob(undoJob);
    setUndoJob(null);
  }, [undoJob, saveJob]);

  const sections = useMemo(() => {
    const filtered = filterJobs(savedJobs, activeFilter, savedTimestamps);
    const buckets = new Map<string, Job[]>();
    filtered.forEach(job => {
      const key = dateBucket(savedTimestamps[job.id]);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(job);
    });
    return BUCKET_ORDER
      .filter(b => buckets.has(b))
      .map(b => ({ title: b, data: buckets.get(b)! }));
  }, [savedJobs, savedTimestamps, activeFilter]);

  const totalFiltered = sections.reduce((n, s) => n + s.data.length, 0);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Kaydettiklerim</Text>
          <Text style={styles.headingCount}>{totalFiltered} ilan</Text>
        </View>

        {/* Filter chips */}
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

      {/* Loading */}
      {loading && savedJobs.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : sections.length === 0 ? (
        /* Empty state */
        <View style={styles.empty}>
          <LinearGradient
            colors={['#7c6dfa', '#4facfe']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.emptyIcon}
          >
            <Ionicons name="bookmark" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>
            {activeFilter === 'Tümü'
              ? 'Henüz ilan kaydetmedin'
              : 'Eşleşen ilan yok'}
          </Text>
          <Text style={styles.emptyDesc}>
            {activeFilter === 'Tümü'
              ? 'Feed\'de beğendiğin ilanları kaydet, buradan takip et.'
              : 'Bu filtre için kaydettiğin ilan bulunmuyor.'}
          </Text>
          {activeFilter === 'Tümü' ? (
            <TouchableOpacity
              onPress={() => router.push('/')}
              activeOpacity={0.8}
              style={styles.emptyCta}
            >
              <Text style={styles.emptyCtaText}>İlanları Keşfet →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setActiveFilter('Tümü')}
              activeOpacity={0.8}
              style={styles.emptyCta}
            >
              <Text style={styles.emptyCtaText}>Tümünü Gör</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* List */
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
          renderItem={({ item }) => (
            <SavedCard
              job={item}
              onRemove={() => handleRemove(item)}
              onPress={() => router.push(`/job/${item.id}`)}
            />
          )}
        />
      )}

      {/* Undo toast */}
      <UndoToast
        visible={undoJob !== null}
        onUndo={handleUndo}
        bottomOffset={insets.bottom}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
    },
    center: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
    },

    // Header
    header: {
      paddingHorizontal: 18,
      paddingTop: 6,
      paddingBottom: 0,
      backgroundColor: c.bg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12,
    },
    heading: {
      color: c.text,
      fontSize: 30,
      fontWeight: '700',
      letterSpacing: -0.8,
    },
    headingCount: {
      color: c.textMuted,
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
      paddingHorizontal: 14,
      borderRadius: RADII.full,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.bgDeep,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: c.isDark ? 0 : 0.06,
      shadowRadius: 4,
      elevation: c.isDark ? 0 : 1,
    },
    filterChipActive: {
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderColor: c.isDark ? 'rgba(255,255,255,0.25)' : c.accent,
      shadowOpacity: c.isDark ? 0 : 0.18,
      shadowRadius: 8,
      elevation: c.isDark ? 0 : 3,
    },
    filterText: {
      fontSize: FONT_SIZES.xs + 1,
      fontWeight: '600',
      color: c.textMuted,
      letterSpacing: -0.1,
    },
    filterTextActive: {
      color: '#ffffff',
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
      color: c.textMuted,
    },
    groupLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.cardBorder,
    },

    // Card
    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.bgDeep,
      overflow: 'hidden',
      marginTop: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0.25 : 0.07,
      shadowRadius: 10,
      elevation: 2,
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
      color: c.text,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 18,
      letterSpacing: -0.2,
    },
    cardSub: {
      color: c.textMuted,
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
    matchPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingTop: 3,
      paddingBottom: 3,
      paddingLeft: 6,
      paddingRight: 7,
      borderRadius: RADII.full,
      borderWidth: 1,
    },
    matchDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
    matchText: {
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.1,
    },
    metaTag: {
      fontSize: 10.5,
      fontWeight: '500',
      color: c.textMuted,
    },
    metaSep: {
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: c.cardBorder,
    },

    // Card actions
    cardActions: {
      alignItems: 'flex-end',
      gap: 6,
      flexShrink: 0,
    },
    removeBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 11,
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.isDark ? 0 : 0.25,
      shadowRadius: 8,
      elevation: c.isDark ? 0 : 3,
    },
    applyText: {
      color: '#ffffff',
      fontSize: 12.5,
      fontWeight: '700',
      letterSpacing: -0.1,
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
      color: c.text,
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    emptyDesc: {
      color: c.textMuted,
      fontSize: FONT_SIZES.sm,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 260,
    },
    emptyCta: {
      marginTop: SPACING.xs,
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.sm + 4,
      borderRadius: RADII.full,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: c.isDark ? 0 : 0.28,
      shadowRadius: 14,
      elevation: c.isDark ? 0 : 4,
    },
    emptyCtaText: {
      color: '#ffffff',
      fontSize: FONT_SIZES.sm,
      fontWeight: '700',
    },

    // Undo toast
    toast: {
      position: 'absolute',
      left: 14,
      right: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      zIndex: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: c.isDark ? 0.4 : 0.10,
      shadowRadius: 16,
      elevation: 6,
    },
    toastText: {
      color: c.text,
      fontSize: FONT_SIZES.sm,
      fontWeight: '500',
    },
    toastUndo: {
      color: '#7c6dfa',
      fontSize: FONT_SIZES.sm,
      fontWeight: '700',
    },
  });
}
