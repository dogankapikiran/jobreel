import React, { useEffect, useMemo } from 'react';
import { DimensionValue, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types';
import { RADII } from '@/constants/theme';
import { timeAgo } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { useJobCardActions } from '@/hooks/useJobCardActions';
import { workTypeShort, seniorityLabel, employmentShort } from '@/utils/jobLabels';
import { makeStyles } from '@/styles/jobCardStyles';
import CompanyLogo from './CompanyLogo';
import ActionButtons from './ActionButtons';
import SkillAnalysisSection from './SkillAnalysisSection';

interface Props {
  job: Job;
  cardHeight: number;
}

const JobCard = React.memo(function JobCard({ job, cardHeight }: Props) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const session = useAuthStore((s) => s.session);

  const {
    saved,
    applied,
    followed,
    handleSave,
    handleShare,
    handleApply,
    handleExplore,
    handleToggleFollow,
    cleanup,
  } = useJobCardActions(job);

  useEffect(() => cleanup, [cleanup]);

  const sl   = seniorityLabel(job.seniority);
  const wts  = workTypeShort(job.workType);
  const city = job.location.split(',')[0]?.trim() || '';
  const es = (!sl && !wts) ? employmentShort(job.employmentType) : '';
  const chipParts = [sl, wts, es].filter(Boolean);
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
              <View style={styles.companyNameRow}>
                <Text style={styles.companyName} numberOfLines={1}>{job.company}</Text>
                <TouchableOpacity
                  onPress={handleToggleFollow}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.followBtn, followed && styles.followBtnActive]}
                  accessibilityRole="button"
                  accessibilityLabel={followed ? `${job.company} takipten çık` : `${job.company} takip et`}
                >
                  <Ionicons
                    name={followed ? 'notifications' : 'notifications-outline'}
                    size={18}
                    color={followed ? '#f59e0b' : colors.textDim}
                  />
                </TouchableOpacity>
              </View>
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
                  <View style={[styles.scoreBarFill, { width: `${job.score}%` as DimensionValue }]} />
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
        <TouchableOpacity onPress={handleExplore} activeOpacity={0.8} style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textDim} style={styles.titleChevron} />
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

        <SkillAnalysisSection
          session={session}
          matchedSkills={job.matchedSkills}
          missingSkills={job.missingSkills}
          skills={job.skills}
          potentialScore={job.potentialScore}
          colors={colors}
        />

        {/* Profil tam uyumlu rozet */}
        {showProfileMatch && (
          <View style={styles.profileMatchBadge}>
            <Ionicons name="checkmark-circle-outline" size={15} color={colors.isDark ? colors.text : colors.accent} />
            <Text style={styles.profileMatchBadgeText}>Profil tam uyumlu</Text>
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
