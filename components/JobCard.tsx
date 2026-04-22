import React, { useRef } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Job } from '@/types';
import {
  CARD_BACKGROUNDS,
  COLORS,
  FONT_SIZES,
  GRADIENTS,
  RADII,
  SPACING,
} from '@/constants/theme';
import { timeAgo } from '@/services/adzuna';
import { useFeedStore } from '@/store/feedStore';
import { useUserStore } from '@/store/userStore';
import TagBadge from './TagBadge';
import SalaryBlock from './SalaryBlock';
import ActionButtons from './ActionButtons';

interface Props {
  job: Job;
  cardHeight: number;
  onNext?: () => void;
}

function workTypeInfo(wt: Job['workType']): { icon: string; label: string } {
  switch (wt) {
    case 'remote':  return { icon: '🌍', label: 'Remote' };
    case 'hybrid':  return { icon: '🏠', label: 'Hibrit' };
    case 'office':  return { icon: '🏢', label: 'Ofis' };
    default:        return { icon: '📍', label: 'Belirtilmemiş' };
  }
}

function seniorityLabel(s: Job['seniority']): string {
  switch (s) {
    case 'junior': return 'Junior';
    case 'mid':    return 'Mid-Level';
    case 'senior': return 'Senior';
    case 'lead':   return 'Lead';
    default:       return '';
  }
}

export default function JobCard({ job, cardHeight, onNext }: Props) {
  const { saveJob, unsaveJob, isSaved, markApplied, isApplied } = useFeedStore();
  const { addInteraction } = useUserStore();
  const viewStart = useRef(Date.now());

  const saved   = isSaved(job.id);
  const applied = isApplied(job.id);
  const wt      = workTypeInfo(job.workType);
  const sl      = seniorityLabel(job.seniority);

  const cardBg    = CARD_BACKGROUNDS[job.accentIndex % CARD_BACKGROUNDS.length];
  const gradient  = GRADIENTS[job.accentIndex % GRADIENTS.length];
  const accent    = gradient[0];

  function handlePass() {
    const dur = Math.round((Date.now() - viewStart.current) / 1000);
    addInteraction({ jobId: job.id, action: 'skip', durationSeconds: dur, timestamp: Date.now() });
    onNext?.();
  }

  function handleSave() {
    if (saved) {
      unsaveJob(job.id);
    } else {
      saveJob(job);
      addInteraction({ jobId: job.id, action: 'save', timestamp: Date.now() });
    }
  }

  function handleApply() {
    if (!applied) {
      markApplied(job.id);
      addInteraction({ jobId: job.id, action: 'apply', timestamp: Date.now() });
    }
    Linking.openURL(job.url).catch(() => {});
  }

  return (
    <View style={[styles.card, { height: cardHeight }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={cardBg}
        locations={[0, 0.5, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative glow circle */}
      <View style={[styles.bgCircle, { backgroundColor: accent }]} />

      {/* Company row */}
      <View style={styles.companyRow}>
        <LinearGradient colors={gradient} style={styles.logo}>
          <Text style={styles.logoLetter}>{job.company.charAt(0).toUpperCase()}</Text>
        </LinearGradient>

        <View style={styles.companyMeta}>
          <Text style={styles.companyName}>{job.company}</Text>
          <View style={styles.metaLine}>
            <View style={styles.onlineDot} />
            <Text style={styles.metaText}>{job.location} · {timeAgo(job.postedAt)}</Text>
          </View>
        </View>

        <View style={[styles.newBadge, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
          <Text style={[styles.newBadgeText, { color: accent }]}>YENİ</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.subtitle}>{job.sector}</Text>

      {/* Tags */}
      <View style={styles.tags}>
        <TagBadge label={`${wt.icon} ${wt.label}`} variant={job.workType} />
        <TagBadge label="Tam Zamanlı" />
        {sl ? <TagBadge label={sl} variant={job.seniority} /> : null}
      </View>

      {/* Salary */}
      <SalaryBlock
        salaryMin={job.salaryMin}
        salaryMax={job.salaryMax}
        currency={job.salaryCurrency}
        period={job.salaryPeriod}
        accentIndex={job.accentIndex}
      />

      {/* Info pills */}
      <View style={styles.pills}>
        <View style={styles.pill}>
          <Text style={styles.pillIcon}>{wt.icon}</Text>
          <Text style={styles.pillPrimary}>{wt.label}</Text>
          <Text style={styles.pillSub}>Çalışma tipi</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillIcon}>⚡</Text>
          <Text style={styles.pillPrimary}>Hızlı</Text>
          <Text style={styles.pillSub}>Yanıt</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillIcon}>👥</Text>
          <Text style={styles.pillPrimary}>{job.companySize ?? '?'}</Text>
          <Text style={styles.pillSub}>Çalışan</Text>
        </View>
      </View>

      {/* Actions */}
      <ActionButtons
        accentIndex={job.accentIndex}
        isSaved={saved}
        isApplied={applied}
        onPass={handlePass}
        onSave={handleSave}
        onApply={handleApply}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.06,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
    marginBottom: SPACING.lg + 4,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  companyMeta: {
    flex: 1,
  },
  companyName: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: 3,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDim,
  },
  newBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: SPACING.xs + 2,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textDim,
    marginBottom: SPACING.lg + 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg + 4,
  },
  pills: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
    marginBottom: SPACING.lg,
  },
  pill: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADII.md,
    padding: SPACING.sm + 4,
    alignItems: 'center',
  },
  pillIcon: {
    fontSize: 18,
    marginBottom: SPACING.xs,
  },
  pillPrimary: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  pillSub: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    lineHeight: 14,
  },
});
