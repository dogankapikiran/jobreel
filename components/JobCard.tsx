import React, { useCallback } from 'react';
import { Alert, AppState, Linking, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { EmploymentType, Job, Seniority } from '@/types';
import {
  COLORS,
  FONT_SIZES,
  RADII,
  SPACING,
} from '@/constants/theme';
import { timeAgo } from '@/services/api';
import { useFeedStore } from '@/store/feedStore';
import { useUserStore } from '@/store/userStore';
import { useCompanyStore } from '@/store/companyStore';
import { api } from '@/services/api';
import { track } from '@/services/analytics';
import { useBrandColor } from '@/hooks/useBrandColor';
import CompanyLogo from './CompanyLogo';
import TagBadge from './TagBadge';
import SalaryBlock from './SalaryBlock';
import ActionButtons from './ActionButtons';

interface Props {
  job: Job;
  cardHeight: number;
  onNext?: () => void;
}

function workTypeShort(wt: Job['workType']): string {
  switch (wt) {
    case 'remote': return 'UZAKTAN';
    case 'hybrid': return 'HİBRİT';
    case 'office': return 'OFİS';
    default:       return '';
  }
}

function workTypeLabel(wt: Job['workType']): string {
  switch (wt) {
    case 'remote': return 'Uzaktan';
    case 'hybrid': return 'Hibrit';
    case 'office': return 'Ofis';
    default:       return '';
  }
}

function employmentLabel(e: EmploymentType): string | null {
  switch (e) {
    case 'fulltime':   return 'Tam Zamanlı';
    case 'parttime':   return 'Yarı Zamanlı';
    case 'contract':   return 'Sözleşmeli';
    case 'internship': return 'Staj';
    default:           return null;
  }
}

function seniorityLabel(s: Seniority): string {
  switch (s) {
    case 'junior': return 'JUNIOR';
    case 'mid':    return 'MİD';
    case 'senior': return 'SENİOR';
    case 'lead':   return 'LEAD';
    default:       return '';
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#fbbf24';
  return '#94a3b8';
}

/** Hex rengi belirli bir opaklıkta rgba string'e dönüştürür */
function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const JobCard = React.memo(function JobCard({ job, cardHeight }: Props) {
  const { saveJob, unsaveJob, isSaved, markApplied, isApplied } = useFeedStore();
  const { addInteraction } = useUserStore();
  const { isFollowing, follow, unfollow } = useCompanyStore();

  const followed = isFollowing(job.company);
  const saved    = isSaved(job.id);
  const applied  = isApplied(job.id);

  const handleToggleFollow = useCallback(() => {
    if (followed) {
      unfollow(job.company);
      api.unfollowCompany(job.company).catch(() => {});
    } else {
      follow(job.company);
      api.followCompany(job.company).catch(() => {});
    }
  }, [followed, job.company, follow, unfollow]);

  const { cardBg, gradient, accent } = useBrandColor(job.company);

  const sl   = seniorityLabel(job.seniority);
  const wts  = workTypeShort(job.workType);
  const wtl  = workTypeLabel(job.workType);
  const el   = employmentLabel(job.employmentType);
  const city = job.location.split(',')[0]?.trim() || '';

  const chipParts = [sl, wts].filter(Boolean);

  const handleSave = useCallback(() => {
    if (saved) {
      unsaveJob(job.id);
      api.unsaveJob(job.id).catch(() => {});
    } else {
      saveJob(job);
      addInteraction({ jobId: job.id, action: 'save', timestamp: Date.now() });
      api.postInteraction(job.id, 'save', job).catch(() => {});
      track('Job Saved', { job_id: job.id, company: job.company, title: job.title, score: job.score });
    }
  }, [saved, job, saveJob, unsaveJob, addInteraction]);

  const handleShare = useCallback(() => {
    Share.share({ message: `${job.title} – ${job.company}\n${job.url}` });
  }, [job]);

  const handleApply = useCallback(() => {
    Linking.openURL(job.url).catch(() => {});
    if (applied) return;

    let confirmed = false;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !confirmed) {
        confirmed = true;
        sub.remove();
        setTimeout(() => {
          Alert.alert(
            'Başvuru tamamlandı mı?',
            `${job.company} pozisyonuna başvurdunuz mu?`,
            [
              {
                text: 'Evet, başvurdum',
                onPress: () => {
                  markApplied(job);
                  addInteraction({ jobId: job.id, action: 'apply', timestamp: Date.now() });
                  api.postInteraction(job.id, 'apply', job).catch(() => {});
                  track('Job Applied', { job_id: job.id, company: job.company, title: job.title, score: job.score });
                },
              },
              { text: 'Hayır', style: 'cancel' },
            ]
          );
        }, 400);
      }
    });
  }, [applied, job, markApplied, addInteraction]);

  const handleExplore = useCallback(() => {
    addInteraction({ jobId: job.id, action: 'view', timestamp: Date.now() });
    api.postInteraction(job.id, 'view', job).catch(() => {});
    track('Job Detail Viewed', { job_id: job.id, company: job.company, title: job.title, score: job.score });
    router.push(`/job/${job.id}`);
  }, [job, addInteraction]);

  return (
    <View style={[styles.outer, { height: cardHeight }]}>
      <View style={styles.inner}>
        {/* Arka plan: koyu tinted base */}
        <LinearGradient
          colors={cardBg}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Sağ üst köşe radial taklidi — CSS radial-gradient(at 90% 10%) approx */}
        <LinearGradient
          colors={[hexAlpha(gradient[0], 0.65), hexAlpha(gradient[0], 0.18), 'transparent']}
          locations={[0, 0.42, 0.75]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.05, y: 0.95 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Sol alt köşe hafif ambient — CSS radial-gradient(at -10% 110%) approx */}
        <LinearGradient
          colors={['transparent', hexAlpha(accent, 0.10), hexAlpha(accent, 0.20)]}
          locations={[0.45, 0.78, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Şirket satırı */}
        <View style={styles.companyRow}>
          {/* Sol: logo + isim + tarih */}
          <TouchableOpacity onPress={handleToggleFollow} activeOpacity={0.7} style={styles.companyLeft}>
            <CompanyLogo
              company={job.company}
              gradient={gradient}
              size={42}
              borderRadius={RADII.md}
            />
            <View style={styles.companyMeta}>
              <View style={styles.companyNameRow}>
                <Text style={styles.companyName}>{job.company}</Text>
                <Text style={[styles.followBadge, followed && styles.followBadgeActive]}>
                  {followed ? '★' : '☆'}
                </Text>
              </View>
              <Text style={styles.postedAt}>{timeAgo(job.postedAt)}</Text>
            </View>
          </TouchableOpacity>

          {/* Sağ: ikon çifti + eşleşme skoru */}
          <View style={styles.rightColumn}>
            <View style={styles.iconPair}>
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.7}
                style={[styles.iconBtn, saved && styles.iconBtnSaved]}
              >
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                  color={saved ? '#f59e0b' : 'rgba(255,255,255,0.6)'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} activeOpacity={0.7} style={styles.iconBtn}>
                <Ionicons name="share-outline" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            {job.score !== undefined && (
              <View style={styles.scoreBlock}>
                <Text style={[styles.scoreLabel, { color: scoreColor(job.score) }]}>EŞLEŞME</Text>
                <View style={styles.scoreNumberRow}>
                  <Text style={styles.scoreNumber}>{job.score}</Text>
                  <Text style={styles.scorePercent}>%</Text>
                </View>
                <View style={styles.scoreBarBg}>
                  <View
                    style={[
                      styles.scoreBarFill,
                      { width: `${job.score}%` as any, backgroundColor: scoreColor(job.score) },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Seniority + WorkType chip — brand rengiyle */}
        {chipParts.length > 0 && (
          <View style={[
            styles.seniorityChip,
            { borderColor: hexAlpha(accent, 0.45), backgroundColor: hexAlpha(accent, 0.14) },
          ]}>
            <Text style={[styles.seniorityChipText, { color: accent }]}>
              {chipParts.join(' · ')}
            </Text>
          </View>
        )}

        {/* Başlık */}
        <Text style={styles.title} numberOfLines={2}>{job.title}</Text>

        {/* Konum pill */}
        <View style={styles.locationPill}>
          <View style={[styles.locationIconBox, { backgroundColor: hexAlpha(accent, 0.18) }]}>
            <Ionicons name="location-outline" size={13} color={accent} />
          </View>
          <View>
            <Text style={styles.locationCity}>{city || job.location}</Text>
            {(wtl || el) ? (
              <Text style={styles.locationSub}>{[wtl, el].filter(Boolean).join(' · ')}</Text>
            ) : null}
          </View>
        </View>

        {/* Skill tag chips */}
        {job.skills && job.skills.length > 0 && (
          <View style={styles.tags}>
            {job.skills.slice(0, 5).map((tag) => (
              <TagBadge key={tag} label={tag} />
            ))}
          </View>
        )}

        {/* Maaş */}
        <SalaryBlock
          salaryMin={job.salaryMin}
          salaryMax={job.salaryMax}
          currency={job.salaryCurrency}
          period={job.salaryPeriod}
          accent={accent}
        />

        {/* Coaching Pill */}
        {job.missingSkills && job.missingSkills.length > 0 && (
          <View style={[styles.coachingPill, { borderColor: hexAlpha(accent, 0.3), backgroundColor: hexAlpha(accent, 0.1) }]}>
            <Text style={[styles.coachingIcon, { color: accent }]}>✦</Text>
            <Text style={[styles.coachingText, { color: accent }]} numberOfLines={1}>
              {`${job.missingSkills.slice(0, 2).join(', ')}${job.missingSkills.length > 2 ? ` +${job.missingSkills.length - 2}` : ''} ekle${job.potentialScore ? ` → %${job.potentialScore}` : ''}`}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <ActionButtons
          isApplied={applied}
          onApply={handleApply}
          onExplore={handleExplore}
        />
      </View>
    </View>
  );
});

export default JobCard;

const styles = StyleSheet.create({
  /* Outer wrapper: tam yükseklik + kenar boşlukları */
  outer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  /* İç kart: yuvarlatılmış köşe + kenarlık */
  inner: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  companyLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  companyMeta: {
    flex: 1,
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 3,
  },
  companyName: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  followBadge: {
    fontSize: 14,
    color: COLORS.textDim,
  },
  followBadgeActive: {
    color: '#f59e0b',
  },
  postedAt: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  iconPair: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnSaved: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderColor: 'rgba(245,158,11,0.45)',
  },
  scoreBlock: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  scoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  scoreNumber: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  scorePercent: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  scoreBarBg: {
    marginTop: 4,
    width: 70,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: 3,
    borderRadius: 2,
  },
  seniorityChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: RADII.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  seniorityChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.12 * 10,
    textTransform: 'uppercase',
  },
  title: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1.4,
    lineHeight: 38,
    marginTop: 10,
    marginBottom: SPACING.md + 4,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: SPACING.md,
    gap: 10,
  },
  locationIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationCity: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  locationSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
  coachingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    alignSelf: 'stretch',
  },
  coachingIcon: {
    fontSize: 12,
    flexShrink: 0,
  },
  coachingText: {
    fontSize: FONT_SIZES.xs + 0.5,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
});
