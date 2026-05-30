import React, { useCallback, useMemo } from 'react';
import { Alert, AppState, Linking, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { EmploymentType, Job, Seniority } from '@/types';
import {
  FONT_SIZES,
  RADII,
  SPACING,
  ThemeColors,
} from '@/constants/theme';
import { timeAgo } from '@/services/api';
import { useFeedStore } from '@/store/feedStore';
import { useUserStore } from '@/store/userStore';
import { useCompanyStore } from '@/store/companyStore';
import { api } from '@/services/api';
import { track } from '@/services/analytics';
import { useTheme } from '@/contexts/ThemeContext';
import CompanyLogo from './CompanyLogo';
import ActionButtons from './ActionButtons';

interface Props {
  job: Job;
  cardHeight: number;
  onNext?: () => void;
}

function safeOpenURL(url: string): void {
  try {
    const { protocol } = new URL(url);
    if (protocol !== 'https:' && protocol !== 'http:') return;
    Linking.openURL(url).catch(() => {});
  } catch {}
}

function workTypeShort(wt: Job['workType']): string {
  switch (wt) {
    case 'remote': return 'UZAKTAN';
    case 'hybrid': return 'HİBRİT';
    case 'office': return 'OFİS';
    default:       return '';
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

function employmentShort(e: EmploymentType): string {
  switch (e) {
    case 'fulltime':   return 'TAM ZAMANLI';
    case 'parttime':   return 'YARI ZAMANLI';
    case 'contract':   return 'SÖZLEŞMELİ';
    case 'internship': return 'STAJ';
    default:           return '';
  }
}

const JobCard = React.memo(function JobCard({ job, cardHeight }: Props) {
  const { saveJob, unsaveJob, isSaved, markApplied, isApplied } = useFeedStore();
  const { addInteraction } = useUserStore();
  const { isFollowing, follow, unfollow } = useCompanyStore();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  const sl   = seniorityLabel(job.seniority);
  const wts  = workTypeShort(job.workType);
  const city = job.location.split(',')[0]?.trim() || '';

  const es = (!sl && !wts) ? employmentShort(job.employmentType) : '';
  const chipParts = [sl, wts, es].filter(Boolean);

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
    safeOpenURL(job.url);
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

  const showProfileMatch = job.score !== undefined && job.score >= 80;

  return (
    <View style={[styles.outer, { height: cardHeight }]}>
      <View style={styles.inner}>

        {/* Şirket satırı */}
        <View style={styles.companyRow}>
          <View style={styles.companyLeft}>
            <CompanyLogo
              company={job.company}
              size={42}
              borderRadius={RADII.md}
            />
            <View style={styles.companyMeta}>
              <TouchableOpacity onPress={handleToggleFollow} activeOpacity={0.7} style={styles.companyNameRow}>
                <Text style={styles.companyName} numberOfLines={1}>{job.company}</Text>
                <Text style={[styles.followBadge, followed && styles.followBadgeActive]}>
                  {followed ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.postedAt}>{timeAgo(job.postedAt)}</Text>
            </View>
          </View>

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
                  color={saved ? '#f59e0b' : colors.textDim}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} activeOpacity={0.7} style={styles.iconBtn}>
                <Ionicons name="share-outline" size={16} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            {job.score !== undefined && (
              <View style={styles.scoreBlock}>
                <Text style={styles.scoreLabel}>EŞLEŞME</Text>
                <View style={styles.scoreNumberRow}>
                  <Text style={styles.scoreNumber}>{job.score}</Text>
                  <Text style={styles.scorePercent}>%</Text>
                </View>
                <View style={styles.scoreBarBg}>
                  <View style={[styles.scoreBarFill, { width: `${job.score}%` as any }]} />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Seniority + WorkType chip */}
        {chipParts.length > 0 && (
          <View style={styles.seniorityChip}>
            <Text style={styles.seniorityChipText}>{chipParts.join(' · ')}</Text>
          </View>
        )}

        {/* Başlık */}
        <TouchableOpacity onPress={handleExplore} activeOpacity={0.8}>
          <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
        </TouchableOpacity>

        {/* Konum pill */}
        {(city || job.location) ? (
          <View style={styles.locationPill}>
            <View style={styles.locationIconBox}>
              <Ionicons name="location-outline" size={13} color="#ffffff" />
            </View>
            <Text style={styles.locationCity}>{city || job.location}</Text>
          </View>
        ) : null}

        {/* Beceri Analizi */}
        {(() => {
          let matched: string[] = [];
          let missing: string[] = [];

          if (job.skills && job.skills.length > 0) {
            job.skills.slice(0, 5).forEach((s) => {
              if (job.missingSkills?.includes(s)) missing.push(s);
              else matched.push(s);
            });
          } else {
            matched = (job.matchedSkills ?? []).slice(0, 3);
            missing = (job.missingSkills ?? []).slice(0, 2);
          }

          if (matched.length === 0 && missing.length === 0) return null;

          return (
            <View style={styles.skillAnalysis}>
              <Text style={styles.skillAnalysisTitle}>Beceri Analizi</Text>
              {matched.length > 0 && (
                <View style={styles.skillsWrap}>
                  {matched.map((s) => (
                    <View key={s} style={styles.matchedChip}>
                      <Text style={styles.matchedChipText}>✓ {s}</Text>
                    </View>
                  ))}
                </View>
              )}
              {missing.length > 0 && (
                <>
                  <Text style={styles.growthHint}>
                    {job.potentialScore
                      ? `Bunları eklersen skorun %${job.potentialScore}'e çıkar:`
                      : 'Bunları eklersen skorun artar:'}
                  </Text>
                  <View style={styles.skillsWrap}>
                    {missing.map((s) => (
                      <View key={s} style={styles.growthChip}>
                        <Text style={styles.growthChipText}>+ {s}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          );
        })()}

        {/* Profil tam uyumlu CTA */}
        {showProfileMatch && (
          <TouchableOpacity style={styles.profileMatchBtn} onPress={handleExplore} activeOpacity={0.85}>
            <View style={styles.profileMatchPlus}>
              <Text style={styles.profileMatchPlusText}>+</Text>
            </View>
            <Text style={styles.profileMatchLabel}>Profil tam uyumlu</Text>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.exploreBtn} onPress={handleExplore} activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={15} color={colors.text} style={{ marginRight: 6 }} />
          <Text style={styles.exploreBtnText}>İlanı İncele</Text>
        </TouchableOpacity>

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

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    outer: {
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    inner: {
      flex: 1,
      borderRadius: 24,
      backgroundColor: c.cardBg,
      overflow: 'hidden',
      padding: SPACING.lg,
      paddingBottom: SPACING.md,
      shadowColor: c.isDark ? '#000000' : '#051650',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.isDark ? 0.40 : 0.10,
      shadowRadius: 16,
      elevation: 4,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
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
      flex: 1,
      color: c.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '700',
    },
    followBadge: {
      fontSize: 14,
      color: c.textDim,
    },
    followBadgeActive: {
      color: '#f59e0b',
    },
    postedAt: {
      fontSize: FONT_SIZES.xs,
      color: c.textMuted,
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
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.bgDeep,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnSaved: {
      backgroundColor: 'rgba(245,158,11,0.12)',
    },
    scoreBlock: {
      alignItems: 'flex-end',
    },
    scoreLabel: {
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 2,
      color: c.textMuted,
    },
    scoreNumberRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 1,
    },
    scoreNumber: {
      color: c.text,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: -0.5,
      lineHeight: 32,
    },
    scorePercent: {
      color: c.text,
      fontSize: 14,
      fontWeight: '600',
    },
    scoreBarBg: {
      marginTop: 3,
      width: 70,
      height: 3,
      borderRadius: 2,
      backgroundColor: c.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(5,22,80,0.10)',
      overflow: 'hidden',
    },
    scoreBarFill: {
      height: 3,
      borderRadius: 2,
      backgroundColor: c.isDark ? 'rgba(255,255,255,0.45)' : c.text,
    },
    seniorityChip: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: RADII.full,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
      backgroundColor: c.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(5,22,80,0.07)',
      borderColor: c.cardBorder,
    },
    seniorityChipText: {
      fontSize: 10.5,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.text,
    },
    title: {
      color: c.text,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: -0.5,
      lineHeight: 33,
      marginTop: 10,
      marginBottom: SPACING.md + 4,
    },
    locationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: c.bgDeep,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: SPACING.md,
      gap: 10,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
    },
    locationIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    locationCity: {
      color: c.text,
      fontSize: FONT_SIZES.sm,
      fontWeight: '700',
    },
    skillAnalysis: {
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    skillAnalysisTitle: {
      color: c.text,
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
    },
    skillsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    matchedChip: {
      backgroundColor: 'rgba(46,204,113,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(46,204,113,0.3)',
      borderRadius: RADII.full,
      paddingHorizontal: SPACING.sm + 4,
      paddingVertical: SPACING.xs + 2,
    },
    matchedChipText: {
      color: '#1db860',
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
    growthHint: {
      color: c.textDim,
      fontSize: FONT_SIZES.xs,
      fontWeight: '500',
    },
    growthChip: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.cardBorder,
      borderRadius: RADII.full,
      paddingHorizontal: SPACING.sm + 4,
      paddingVertical: SPACING.xs + 2,
      backgroundColor: 'transparent',
    },
    growthChipText: {
      color: c.textDim,
      fontSize: FONT_SIZES.xs,
      fontWeight: '500',
    },
    profileMatchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.isDark ? '#1a2540' : c.accent,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 20,
      marginBottom: SPACING.sm,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
    },
    profileMatchPlus: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileMatchPlusText: {
      color: '#ffffff',
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
    },
    profileMatchLabel: {
      color: c.isDark ? c.text : '#ffffff',
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
    },
    exploreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RADII.md,
      borderWidth: 1.5,
      borderColor: c.cardBorder,
      paddingVertical: 13,
      marginBottom: SPACING.sm,
    },
    exploreBtnText: {
      color: c.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
    },
  });
}
