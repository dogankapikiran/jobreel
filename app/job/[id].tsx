import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeedStore } from '@/store/feedStore';
import { useUserStore } from '@/store/userStore';
import { api, timeAgo } from '@/services/api';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useBrandColor } from '@/hooks/useBrandColor';
import CompanyLogo from '@/components/CompanyLogo';
import TagBadge from '@/components/TagBadge';

type DescItem =
  | { kind: 'head'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'para'; text: string };

function buildDescItems(rawDesc: string): DescItem[] {
  const clean = rawDesc
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*/g, '')
    .replace(/\\\-/g, '-')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const items: DescItem[] = [];

  for (const line of clean.split('\n').map(s => s.trim()).filter(Boolean)) {
    // Explicit bullet or numbered marker
    if (/^[*•\-·]\s*\S/.test(line) || /^\d+[).]\s*\S/.test(line)) {
      const text = line.replace(/^[*•\-·]\s*/, '').replace(/^\d+[).]\s*/, '').trim();
      if (text.length >= 5) items.push({ kind: 'bullet', text });
      continue;
    }

    const wordCount = line.split(/\s+/).length;
    // Section heading: short, capital start, no terminal punctuation, no technical chars
    if (
      wordCount <= 5 &&
      line.length <= 55 &&
      /^[A-ZÇĞİÖŞÜ]/.test(line) &&
      !/[.!?]$/.test(line) &&
      !/[\d+\/%.@]/.test(line)
    ) {
      items.push({ kind: 'head', text: line });
      continue;
    }

    if (line.length >= 10) items.push({ kind: 'para', text: line });
  }

  return items;
}

function workTypeLabel(wt: string): { icon: string; label: string } {
  switch (wt) {
    case 'remote':  return { icon: '🌍', label: 'Remote' };
    case 'hybrid':  return { icon: '🏠', label: 'Hibrit' };
    case 'office':  return { icon: '🏢', label: 'Ofis' };
    default:        return { icon: '📍', label: 'Belirtilmemiş' };
  }
}

function employmentTypeLabel(et: string): string {
  switch (et) {
    case 'fulltime':    return 'Tam Zamanlı';
    case 'parttime':    return 'Part-time';
    case 'contract':    return 'Sözleşmeli';
    case 'internship':  return 'Staj';
    default:            return 'Tam Zamanlı';
  }
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { jobs, savedJobs, saveJob, unsaveJob, isSaved, markApplied, isApplied, updateJobs } = useFeedStore();
  const { addInteraction } = useUserStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const job = jobs.find((j) => j.id === id) ?? savedJobs.find((j) => j.id === id);

  const { gradient, accent } = useBrandColor(job?.company ?? '');

  const [description, setDescription] = useState(job?.description ?? '');
  const [descLoading, setDescLoading] = useState(false);

  const descItems = useMemo(() => buildDescItems(description), [description]);

  useEffect(() => {
    if (!job) return;
    if (description.trim().length > 30) return;
    setDescLoading(true);
    api.getJobDescription(job.id)
      .then(({ description: desc }) => {
        if (desc) {
          setDescription(desc);
          updateJobs([{ ...job, description: desc }]);
        }
      })
      .catch(() => {})
      .finally(() => setDescLoading(false));
  }, [job?.id]);

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
  const saved    = isSaved(job.id);
  const applied  = isApplied(job.id);
  const wt       = workTypeLabel(job.workType);

  function handleApply() {
    Linking.openURL(job!.url).catch(() => {});
    if (applied) return;

    let confirmed = false;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !confirmed) {
        confirmed = true;
        sub.remove();
        setTimeout(() => {
          Alert.alert(
            'Başvuru tamamlandı mı?',
            `${job!.company} pozisyonuna başvurdunuz mu?`,
            [
              {
                text: 'Evet, başvurdum',
                onPress: () => {
                  markApplied(job!);
                  addInteraction({ jobId: job!.id, action: 'apply', timestamp: Date.now() });
                  api.postInteraction(job!.id, 'apply').catch(() => {});
                },
              },
              { text: 'Hayır', style: 'cancel' },
            ]
          );
        }, 400);
      }
    });
  }

  function handleSave() {
    if (saved) {
      unsaveJob(job!.id);
    } else {
      saveJob(job!);
      addInteraction({ jobId: job!.id, action: 'save', timestamp: Date.now() });
    }
  }

  function handleShare() {
    Share.share({ message: `${job!.title} – ${job!.company}\n${job!.url}` });
  }

  const metaParts = [
    `📍 ${job.location}`,
    employmentTypeLabel(job.employmentType),
    timeAgo(job.postedAt),
  ].filter(Boolean);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{job.title}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.saveBtn}>
          <Text style={styles.saveIcon}>⬆</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, saved && styles.saveBtnSaved]}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={saved ? '#f59e0b' : 'rgba(255,255,255,0.45)'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Company row */}
        <View style={styles.companyRow}>
          <CompanyLogo
            company={job.company}
            gradient={gradient}
            size={52}
            borderRadius={RADII.md}
          />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{job.company}</Text>
            <Text style={styles.metaLine} numberOfLines={2}>{metaParts.join(' · ')}</Text>
          </View>
        </View>

        {/* Job title */}
        <Text style={styles.title}>{job.title}</Text>

        {/* Tag badges */}
        <View style={styles.tags}>
          <TagBadge label={`${wt.icon} ${wt.label}`} variant={job.workType} />
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
          {!!job.sector && <TagBadge label={job.sector} />}
        </View>

        {/* Salary */}
        {(job.salaryMin || job.salaryMax) && (
          <>
            <View style={styles.divider} />
            <View style={styles.salaryBlock}>
              <Text style={styles.salaryLabel}>Maaş Aralığı</Text>
              <Text style={[styles.salaryAmount, { color: accent }]}>
                {job.salaryMin && job.salaryMax
                  ? `${job.salaryCurrency}${job.salaryMin.toLocaleString('tr-TR')} – ${job.salaryCurrency}${job.salaryMax.toLocaleString('tr-TR')}`
                  : job.salaryMin
                  ? `${job.salaryCurrency}${job.salaryMin.toLocaleString('tr-TR')}+`
                  : `${job.salaryCurrency}${job.salaryMax!.toLocaleString('tr-TR')}`}
                <Text style={styles.salaryPeriod}> / {job.salaryPeriod}</Text>
              </Text>
            </View>
          </>
        )}

        {/* Skills */}
        {job.skills.length > 0 && (
          <>
            <View style={styles.divider} />
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
          </>
        )}

        {/* Beceri Analizi */}
        {((job.matchedSkills && job.matchedSkills.length > 0) || (job.missingSkills && job.missingSkills.length > 0)) && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Beceri Analizi</Text>
              {(job.matchedSkills ?? []).length > 0 && (
                <View style={styles.skillsWrap}>
                  {(job.matchedSkills ?? []).map((s) => (
                    <View key={`m-${s}`} style={styles.matchedChip}>
                      <Text style={styles.matchedChipText}>✓ {s}</Text>
                    </View>
                  ))}
                </View>
              )}
              {(job.missingSkills ?? []).length > 0 && (
                <View style={styles.growthBlock}>
                  <Text style={styles.growthHint}>
                    {job.potentialScore
                      ? `Bunları eklersen skorun %${job.potentialScore}'e çıkar:`
                      : 'Bunları eklersen skorun artar:'}
                  </Text>
                  <View style={styles.skillsWrap}>
                    {(job.missingSkills ?? []).map((s) => (
                      <View key={`g-${s}`} style={styles.growthChip}>
                        <Text style={styles.growthChipText}>➕ {s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {/* Description */}
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İş Tanımı</Text>
          {descLoading ? (
            <View style={styles.descLoadingRow}>
              <ActivityIndicator size="small" color={accent} />
              <Text style={styles.descLoading}>Açıklama yükleniyor...</Text>
            </View>
          ) : descItems.length > 0 ? (
            descItems.map((item, i) => {
              if (item.kind === 'head') {
                return (
                  <Text key={i} style={styles.descSubHead}>{item.text}</Text>
                );
              }
              if (item.kind === 'bullet') {
                return (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: accent }]}>•</Text>
                    <Text style={styles.bulletText}>{item.text}</Text>
                  </View>
                );
              }
              return (
                <Text key={i} style={styles.description}>{item.text}</Text>
              );
            })
          ) : (
            <Text style={styles.descLoading}>Açıklama bulunamadı.</Text>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <LinearGradient colors={gradient} style={styles.applyGradient}>
          <TouchableOpacity style={styles.applyInner} onPress={handleApply} activeOpacity={0.85}>
            <Text style={styles.applyText}>{applied ? 'Başvuruldu ✓' : 'Hemen Başvur'}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  notFound: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.md,
  },
  backBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full,
  },
  backBtnText: {
    color: colors.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    gap: SPACING.md,
    backgroundColor: colors.bg,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.headerBtnBg,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeIcon: {
    color: colors.textMuted,
    fontSize: 14,
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  saveBtnSaved: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderColor: 'rgba(245,158,11,0.45)',
  },
  saveIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.45)',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  companyInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  companyName: {
    color: colors.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  metaLine: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.xs,
    lineHeight: 17,
  },
  title: {
    color: colors.text,
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
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: SPACING.xs,
  },
  salaryBlock: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  salaryLabel: {
    color: colors.textDim,
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
    color: colors.textDim,
    fontSize: FONT_SIZES.sm,
    fontWeight: '400',
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  skillChip: {
    backgroundColor: `${colors.accent}18`,
    borderWidth: 1,
    borderColor: `${colors.accent}44`,
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
  },
  skillText: {
    color: colors.accentLight,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
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
    color: '#2ecc71',
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  growthBlock: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  growthHint: {
    color: '#a5b4fc',
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  growthChip: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
  },
  growthChipText: {
    color: '#a5b4fc',
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  descSubHead: {
    color: colors.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  description: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
  },
  descLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  descLoading: {
    color: colors.textDim,
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  bulletDot: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
  },
  footer: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.bg,
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
    color: colors.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
});
