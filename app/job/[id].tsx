import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeedStore } from '@/store/feedStore';
import { useUserStore } from '@/store/userStore';
import { timeAgo } from '@/services/adzuna';
import { COLORS, FONT_SIZES, GRADIENTS, RADII, SPACING } from '@/constants/theme';
import TagBadge from '@/components/TagBadge';

function workTypeLabel(wt: string): { icon: string; label: string } {
  switch (wt) {
    case 'remote':  return { icon: '🌍', label: 'Remote' };
    case 'hybrid':  return { icon: '🏠', label: 'Hibrit' };
    case 'office':  return { icon: '🏢', label: 'Ofis' };
    default:        return { icon: '📍', label: 'Belirtilmemiş' };
  }
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { jobs, savedJobs, saveJob, unsaveJob, isSaved, markApplied, isApplied } = useFeedStore();
  const { addInteraction } = useUserStore();

  const job = jobs.find((j) => j.id === id) ?? savedJobs.find((j) => j.id === id);

  if (!job) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>İlan bulunamadı</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const gradient  = GRADIENTS[job.accentIndex % GRADIENTS.length];
  const saved     = isSaved(job.id);
  const applied   = isApplied(job.id);
  const wt        = workTypeLabel(job.workType);

  function handleApply() {
    if (!applied) {
      markApplied(job!.id);
      addInteraction({ jobId: job!.id, action: 'apply', timestamp: Date.now() });
    }
    Linking.openURL(job!.url).catch(() => {});
  }

  function handleSave() {
    if (saved) {
      unsaveJob(job!.id);
    } else {
      saveJob(job!);
      addInteraction({ jobId: job!.id, action: 'save', timestamp: Date.now() });
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{job.title}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveIcon}>{saved ? '🔖' : '🔖'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Company hero */}
        <View style={styles.hero}>
          <LinearGradient colors={gradient} style={styles.logo}>
            <Text style={styles.logoText}>{job.company.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.company}>{job.company}</Text>
          <Text style={styles.location}>📍 {job.location}</Text>
          <Text style={styles.postedAt}>{timeAgo(job.postedAt)}</Text>
        </View>

        {/* Title + tags */}
        <Text style={styles.title}>{job.title}</Text>

        <View style={styles.tags}>
          <TagBadge label={`${wt.icon} ${wt.label}`} variant={job.workType} />
          <TagBadge label="Tam Zamanlı" />
          {job.seniority !== 'unknown' && (
            <TagBadge
              label={
                job.seniority === 'junior' ? 'Junior'
                : job.seniority === 'mid' ? 'Mid-Level'
                : job.seniority === 'senior' ? 'Senior'
                : 'Lead'
              }
              variant={job.seniority}
            />
          )}
        </View>

        {/* Salary */}
        {(job.salaryMin || job.salaryMax) && (
          <View style={styles.salaryBlock}>
            <Text style={styles.salaryLabel}>Maaş Aralığı</Text>
            <Text style={[styles.salaryAmount, { color: gradient[0] }]}>
              {job.salaryMin && job.salaryMax
                ? `${job.salaryCurrency}${job.salaryMin.toLocaleString('tr-TR')} – ${job.salaryCurrency}${job.salaryMax.toLocaleString('tr-TR')}`
                : job.salaryMin
                ? `${job.salaryCurrency}${job.salaryMin.toLocaleString('tr-TR')}+`
                : `${job.salaryCurrency}${job.salaryMax!.toLocaleString('tr-TR')}`}
              <Text style={styles.salaryPeriod}> / {job.salaryPeriod}</Text>
            </Text>
          </View>
        )}

        {/* Skills */}
        {job.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aranan Yetenekler</Text>
            <View style={styles.skillsWrap}>
              {job.skills.map((s) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İlan Açıklaması</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>
      </ScrollView>

      {/* Footer actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <LinearGradient colors={gradient} style={styles.applyGradient}>
          <TouchableOpacity style={styles.applyInner} onPress={handleApply} activeOpacity={0.85}>
            <Text style={styles.applyText}>{applied ? 'Başvuruldu ✓' : 'Başvur →'}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  notFound: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
  },
  backBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full,
  },
  backBtnText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    gap: SPACING.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeIcon: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  saveBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  saveIcon: {
    fontSize: 20,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  hero: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: RADII.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
  },
  company: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  location: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  postedAt: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.xs,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  salaryBlock: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  salaryLabel: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '500',
  },
  salaryAmount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  salaryPeriod: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.sm,
    fontWeight: '400',
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  skillChip: {
    backgroundColor: `${COLORS.accent}18`,
    borderWidth: 1,
    borderColor: `${COLORS.accent}44`,
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
  },
  skillText: {
    color: COLORS.accentLight,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  description: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
  },
  footer: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  applyGradient: {
    borderRadius: RADII.full,
    height: 56,
  },
  applyInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
});
