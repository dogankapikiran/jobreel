import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types';
import { timeAgo } from '@/services/api';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { brandColors } from '@/services/logoService';
import CompanyLogo from '@/components/CompanyLogo';
import { useTheme } from '@/contexts/ThemeContext';
import { hexAlpha, matchDotColor, workModeLabel, safeOpenURL } from '@/constants/savedFilters';

interface CardProps {
  job: Job;
  onRemove: () => void;
  onPress: () => void;
}

export default function SavedCard({ job, onRemove, onPress }: CardProps) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { accent } = brandColors(job.company);
  const score = job.score ?? 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78} style={styles.card}>
      {/* Subtle brand tint — top-right corner */}
      <LinearGradient
        colors={[hexAlpha(accent, 0.08), 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.cardRow}>
        {/* Logo */}
        <CompanyLogo company={job.company} size={44} borderRadius={12} />

        {/* Body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {job.company} · {job.location}
          </Text>
          <View style={styles.metaRow}>
            {score > 0 && (
              <View
                style={[
                  styles.matchPill,
                  {
                    backgroundColor: hexAlpha(accent, 0.1),
                    borderColor: hexAlpha(accent, 0.22),
                  },
                ]}
              >
                <View style={[styles.matchDot, { backgroundColor: matchDotColor(score) }]} />
                <Text style={[styles.matchText, { color: accent }]}>%{score}</Text>
              </View>
            )}
            {job.workType !== 'unknown' && (
              <Text style={styles.metaTag}>{workModeLabel(job.workType)}</Text>
            )}
            <View style={styles.metaSep} />
            <Text style={styles.metaTag}>{timeAgo(job.postedAt)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={onRemove}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={13} color={colors.textDim} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => safeOpenURL(job.url)}
            style={styles.applyBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.applyText}>Başvur</Text>
            <Ionicons name="arrow-forward" size={11} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.bgDeep,
      overflow: 'hidden',
      marginTop: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0.25 : 0.07,
      shadowRadius: 10,
      elevation: 2,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 14,
    },
    cardBody: {
      flex: 1,
      minWidth: 0,
    },
    cardTitle: {
      color: c.text,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 18,
      letterSpacing: -0.2,
    },
    cardSub: {
      color: c.textMuted,
      fontSize: 11.5,
      marginTop: 4,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 9,
      flexWrap: 'wrap',
    },
    matchPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingTop: 3,
      paddingBottom: 3,
      paddingLeft: 6,
      paddingRight: 7,
      borderRadius: RADII.full,
      borderWidth: 1,
    },
    matchDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
    matchText: {
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.1,
    },
    metaTag: {
      fontSize: 10.5,
      fontWeight: '500',
      color: c.textMuted,
    },
    metaSep: {
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: c.cardBorder,
    },
    cardActions: {
      alignItems: 'flex-end',
      gap: 6,
      flexShrink: 0,
    },
    removeBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 11,
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.isDark ? 0 : 0.25,
      shadowRadius: 8,
      elevation: c.isDark ? 0 : 3,
    },
    applyText: {
      color: '#ffffff',
      fontSize: 12.5,
      fontWeight: '700',
      letterSpacing: -0.1,
    },
  });
