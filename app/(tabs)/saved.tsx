import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useSavedStore } from '@/store/savedStore';
import { api } from '@/services/api';
import { BOTTOM_NAV_HEIGHT, FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import AuthGate from '@/components/AuthGate';

// ─── Subcomponents & Helpers ──────────────────────────────────────────────────
import SavedCard from '@/components/saved/SavedCard';
import DateGroupHeader from '@/components/saved/DateGroupHeader';
import UndoToast from '@/components/saved/UndoToast';
import {
  FilterKey,
  FILTERS,
  BUCKET_ORDER,
  filterJobs,
  dateBucket,
} from '@/constants/savedFilters';

export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const { savedJobs, savedTimestamps, saveJob, unsaveJob } = useSavedStore();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('Tümü');
  const [undoJob, setUndoJob] = useState<Job | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (session) {
      refresh();
    }
  }, [!!session]);

  useEffect(() => () => clearTimeout(undoTimer.current), []);

  async function refresh() {
    setLoading(true);
    try {
      const jobs = await api.getSaved();
      jobs.forEach((j) => saveJob(j));
    } catch {
      // fall back to locally cached savedJobs
    } finally {
      setLoading(false);
    }
  }

  const handleRemove = useCallback(
    (job: Job) => {
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
    },
    [undoJob, unsaveJob]
  );

  const handleUndo = useCallback(() => {
    if (!undoJob) return;
    clearTimeout(undoTimer.current);
    saveJob(undoJob);
    setUndoJob(null);
  }, [undoJob, saveJob]);

  const sections = useMemo(() => {
    const filtered = filterJobs(savedJobs, activeFilter, savedTimestamps);
    const buckets = new Map<string, Job[]>();
    filtered.forEach((job) => {
      const key = dateBucket(savedTimestamps[job.id]);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(job);
    });
    return BUCKET_ORDER.filter((b) => buckets.has(b)).map((b) => ({
      title: b,
      data: buckets.get(b)!,
    }));
  }, [savedJobs, savedTimestamps, activeFilter]);

  if (!session) {
    return (
      <AuthGate
        icon="bookmark-outline"
        title="Kaydettiklerim"
        description="Beğendiğiniz iş ilanlarını kaydedip daha sonra incelemek ve başvurmak için giriş yapın."
      />
    );
  }

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
          {FILTERS.map((f) => (
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
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIcon}
          >
            <Ionicons name="bookmark" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>
            {activeFilter === 'Tümü' ? 'Henüz ilan kaydetmedin' : 'Eşleşen ilan yok'}
          </Text>
          <Text style={styles.emptyDesc}>
            {activeFilter === 'Tümü'
              ? "Feed'de beğendiğin ilanları kaydet, buradan takip et."
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + SPACING.lg },
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => <DateGroupHeader title={section.title} />}
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
      <UndoToast visible={undoJob !== null} onUndo={handleUndo} bottomOffset={insets.bottom} />
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
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
    listContent: {
      paddingHorizontal: 14,
      paddingTop: 4,
    },
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
  });
}
