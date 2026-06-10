import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeedStore } from '@/store/feedStore';
import { useSavedStore } from '@/store/savedStore';
import { useAuthStore } from '@/store/authStore';
import { api, timeAgo } from '@/services/api';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import TagBadge from '@/components/TagBadge';
import SkillAnalysisSection from '@/components/SkillAnalysisSection';
import { buildDescItems, workTypeLabel, employmentTypeLabel } from '@/constants/jobDetailHelpers';

import { useApplyJob } from '@/hooks/useApplyJob';
import { useSaveJob } from '@/hooks/useSaveJob';
import { useShareJob } from '@/hooks/useShareJob';

import JobDetailHeader from '@/components/job/JobDetailHeader';
import JobCompanyRow from '@/components/job/JobCompanyRow';
import JobSalaryBlock from '@/components/job/JobSalaryBlock';
import JobDescriptionSection from '@/components/job/JobDescriptionSection';
import JobDetailFooter from '@/components/job/JobDetailFooter';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const session = useAuthStore((s) => s.session);
  const { jobs, updateJobs } = useFeedStore();
  const { savedJobs } = useSavedStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const job = jobs.find((j) => j.id === id) ?? savedJobs.find((j) => j.id === id);

  const [description, setDescription] = useState(job?.description ?? '');
  const [descLoading, setDescLoading] = useState(false);
  const [descError, setDescError] = useState(false);
  const mountedRef = useRef(true);

  // Dummy job to prevent hook crash on undefined job
  const dummyJob = useMemo(() => ({
    id: '',
    externalId: '',
    title: '',
    company: '',
    url: '',
    skills: [],
    matchedSkills: [],
    missingSkills: [],
    potentialScore: 0,
    postedAt: '',
    location: '',
    workType: 'unknown' as const,
    employmentType: '' as const,
    seniority: 'unknown' as const,
    description: '',
    salaryCurrency: '$',
    salaryPeriod: 'month',
    sector: '',
    accentIndex: 0,
  }), []);

  const activeJob = (job || dummyJob) as any;

  const { applied, handleApply, cleanup } = useApplyJob(activeJob);
  const { saved, handleSave } = useSaveJob(activeJob);
  const { handleShare } = useShareJob(activeJob);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const descItems = useMemo(() => buildDescItems(description), [description]);

  useEffect(() => {
    if (!job) return;
    if (description.trim().length > 30) return;
    setDescLoading(true);
    setDescError(false);
    api
      .getJobDescription(job.id)
      .then(({ description: desc }) => {
        if (!mountedRef.current) return;
        if (desc) {
          setDescription(desc);
          updateJobs([{ ...job, description: desc }]);
        }
      })
      .catch(() => {
        if (mountedRef.current) setDescError(true);
      })
      .finally(() => {
        if (mountedRef.current) setDescLoading(false);
      });
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

  const wt = workTypeLabel(job.workType);
  const metaParts = [
    `📍 ${job.location}`,
    employmentTypeLabel(job.employmentType),
    timeAgo(job.postedAt),
  ].filter(Boolean);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <JobDetailHeader
        title={job.title}
        saved={saved}
        colors={colors}
        onBack={() => router.back()}
        onShare={handleShare}
        onSave={handleSave}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <JobCompanyRow
          company={job.company}
          metaLine={metaParts.join(' · ')}
          colors={colors}
        />

        <Text style={styles.title}>{job.title}</Text>

        <View style={styles.tags}>
          <TagBadge label={`${wt.icon} ${wt.label}`} variant={job.workType} />
          {job.seniority !== 'unknown' && (
            <TagBadge
              label={
                job.seniority === 'junior'
                  ? 'Junior'
                  : job.seniority === 'mid'
                  ? 'Mid-Level'
                  : job.seniority === 'senior'
                  ? 'Senior'
                  : 'Lead'
              }
              variant={job.seniority}
            />
          )}
          {!!job.sector && <TagBadge label={job.sector} />}
        </View>

        {(job.salaryMin || job.salaryMax) && <View style={styles.divider} />}
        <JobSalaryBlock
          salaryMin={job.salaryMin}
          salaryMax={job.salaryMax}
          salaryCurrency={job.salaryCurrency}
          salaryPeriod={job.salaryPeriod}
          colors={colors}
        />

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

        <View style={styles.divider} />
        <SkillAnalysisSection
          session={session}
          matchedSkills={job.matchedSkills}
          missingSkills={job.missingSkills}
          skills={job.skills}
          potentialScore={job.potentialScore}
          colors={colors}
        />

        <View style={styles.divider} />
        <JobDescriptionSection
          descLoading={descLoading}
          descError={descError}
          descItems={descItems}
          colors={colors}
        />
      </ScrollView>

      <JobDetailFooter
        applied={applied}
        colors={colors}
        insets={insets}
        onApply={handleApply}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    content: {
      padding: SPACING.lg,
      paddingBottom: SPACING.xl,
      gap: SPACING.md,
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
  });
