import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Job } from '@/types';
import { useFeedStore } from '@/store/feedStore';
import { api } from '@/services/api';
import { timeAgo } from '@/services/adzuna';
import { COLORS, FONT_SIZES, GRADIENTS, RADII, SPACING } from '@/constants/theme';

function SavedJobRow({ job, onRemove }: { job: Job; onRemove: () => void }) {
  const gradient = GRADIENTS[(job.accentIndex ?? 0) % GRADIENTS.length];
  return (
    <View style={styles.row}>
      <LinearGradient colors={gradient} style={styles.logo}>
        <Text style={styles.logoText}>{job.company.charAt(0).toUpperCase()}</Text>
      </LinearGradient>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
        <Text style={styles.meta}>{job.company} · {job.location}</Text>
        <Text style={styles.time}>{timeAgo(job.postedAt)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => Linking.openURL(job.url).catch(() => {})}
          activeOpacity={0.8}
        >
          <LinearGradient colors={gradient} style={styles.applyGradient}>
            <Text style={styles.applyText}>Başvur</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn} activeOpacity={0.7}>
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { savedJobs, setJobs: _, unsaveJob, saveJob } = useFeedStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

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

  async function handleRemove(jobId: string) {
    unsaveJob(jobId);
    api.unsaveJob(jobId).catch(() => {});
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Kaydettiklerim</Text>
        {savedJobs.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{savedJobs.length}</Text>
          </View>
        )}
      </View>

      {loading && savedJobs.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} />
        </View>
      ) : (
      <FlatList
        data={savedJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => (
          <SavedJobRow job={item} onRemove={() => handleRemove(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyTitle}>Henüz kaydetmedin</Text>
            <Text style={styles.emptyDesc}>
              İlan akışında beğendiğin ilanları kaydet, buradan takip et.
            </Text>
          </View>
        }
      />
      )}
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
    paddingTop: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  heading: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: RADII.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  countText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
    paddingVertical: SPACING.sm + 4,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: RADII.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  time: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  applyBtn: {
    borderRadius: RADII.sm,
    overflow: 'hidden',
  },
  applyGradient: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 4,
    borderRadius: RADII.sm,
  },
  applyText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    color: COLORS.textDim,
    fontSize: 14,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: SPACING.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
