import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeedStore } from '@/store/feedStore';
import { useUserStore } from '@/store/userStore';
import { api, timeAgo } from '@/services/api';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import CompanyLogo from '@/components/CompanyLogo';
import TagBadge from '@/components/TagBadge';
import { track } from '@/services/analytics';

function safeOpenURL(url: string): void {
  try {
    const { protocol } = new URL(url);
    if (protocol !== 'https:' && protocol !== 'http:') return;
    Linking.openURL(url).catch(() => {});
  } catch { /* geçersiz URL */ }
}

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
    default:            return '';
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

  const [description, setDescription] = useState(job?.description ?? '');
  const [descLoading, setDescLoading] = useState(false);
  const [descError, setDescError] = useState(false);
  const applySubRef = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);
  const applyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      applySubRef.current?.remove();
      applySubRef.current = null;
      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current);
        applyTimeoutRef.current = null;
      }
    };
  }, []);

  const descItems = useMemo(() => buildDescItems(description), [description]);

  useEffect(() => {
    if (!job) return;
    track('Job Viewed', { job_id: job.id, company: job.company, title: job.title, sector: job.sector });
  }, [job?.id]);

  useEffect(() => {
    if (!job) return;
    if (description.trim().length > 30) return;
    setDescLoading(true);
    setDescError(false);
    api.getJobDescription(job.id)
      .then(({ description: desc }) => {
        if (!mountedRef.current) return;
        if (desc) {
          setDescription(desc);
          updateJobs([{ ...job, description: desc }]);
        }
      })
      .catch(() => { if (mountedRef.current) setDescError(true); })
      .finally(() => { if (mountedRef.current) setDescLoading(false); });
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
    if (applied) { safeOpenURL(job!.url); return; }
    if (applySubRef.current) return;
    safeOpenURL(job!.url);

    const openedAt = Date.now();
    applySubRef.current = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        applySubRef.current?.remove();
        applySubRef.current = null;
        if (Date.now() - openedAt < 2000) return;
        applyTimeoutRef.current = setTimeout(() => {
          applyTimeoutRef.current = null;
          Alert.alert(
            'Başvuru tamamlandı mı?',
            `${job!.company} pozisyonuna başvurdunuz mu?`,
            [
              {
                text: 'Evet, başvurdum',
                onPress: () => {
                  markApplied(job!);
                  addInteraction({ jobId: job!.id, action: 'apply', timestamp: Date.now() });
                  api.postInteraction(job!.id, 'apply', job!).catch(() => {});
                  track('Job Applied', { job_id: job!.id, company: job!.company, title: job!.title, sector: job!.sector });
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
      api.unsaveJob(job!.id).catch(() => { saveJob(job!); });
      addInteraction({ jobId: job!.id, action: 'unsave', timestamp: Date.now() });
      api.postInteraction(job!.id, 'unsave', job!).catch(() => {});
    } else {
      saveJob(job!);
      addInteraction({ jobId: job!.id, action: 'save', timestamp: Date.now() });
      api.postInteraction(job!.id, 'save', job!).catch(() => { unsaveJob(job!.id); });
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
          <Ionicons name="share-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, saved && styles.saveBtnSaved]}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={saved ? '#f59e0b' : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Company row */}
        <View style={styles.companyRow}>
          <CompanyLogo
            company={job.company}
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
              <Text style={[styles.salaryAmount, { color: colors.isDark ? colors.textMuted : colors.accent }]}>
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
              <ActivityIndicator size="small" color={colors.isDark ? colors.textMuted : colors.accent} />
              <Text style={styles.descLoading}>Açıklama yükleniyor...</Text>
            </View>
          ) : descError ? (
            <Text style={styles.descError}>Açıklama yüklenemedi. İnternet bağlantınızı kontrol edin.</Text>
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
                    <Text style={[styles.bulletDot, { color: colors.isDark ? colors.textMuted : colors.accent }]}>•</Text>
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
        <TouchableOpacity
          style={[styles.applyBtn, applied && styles.applyBtnApplied]}
          onPress={handleApply}
          activeOpacity={0.85}
        >
          {applied ? (
            <Text style={[styles.applyText, styles.applyTextApplied]}>Başvuruldu ✓</Text>
          ) : (
            <View style={styles.applyInner}>
              <Text style={styles.applyText}>Hemen Başvur</Text>
              <Ionicons name="open-outline" size={18} color="#ffffff" style={styles.applyIcon} />
            </View>
          )}
        </TouchableOpacity>
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
    backgroundColor: colors.bgDeep,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  saveBtnSaved: {
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.35)',
  },
  saveIcon: {
    fontSize: 18,
    color: colors.textMuted,
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
    backgroundColor: colors.isDark ? 'rgba(226,232,245,0.07)' : `${colors.accent}18`,
    borderWidth: 1,
    borderColor: colors.isDark ? 'rgba(226,232,245,0.2)' : `${colors.accent}44`,
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
  },
  skillText: {
    color: colors.isDark ? colors.textMuted : colors.accentLight,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  matchedChip: {
    backgroundColor: 'rgba(22,163,74,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.2)',
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
  },
  matchedChipText: {
    color: '#16a34a',
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  growthBlock: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  growthHint: {
    color: '#4f46e5',
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  growthChip: {
    backgroundColor: 'rgba(79,70,229,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.2)',
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
  },
  growthChipText: {
    color: '#4f46e5',
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
  descError: {
    color: '#ef4444',
    fontSize: FONT_SIZES.sm,
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
  applyBtn: {
    borderRadius: RADII.md,
    backgroundColor: colors.isDark ? colors.bgDeep : colors.accent,
    borderWidth: colors.isDark ? 1 : 0,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  applyBtnApplied: {
    backgroundColor: 'rgba(46,204,113,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(46,204,113,0.4)',
  },
  applyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  applyText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  applyIcon: {
    opacity: 0.85,
  },
  applyTextApplied: {
    color: '#2ecc71',
  },
});
