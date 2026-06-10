import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';

interface Props {
  session: Session | null;
  matchedSkills?: string[];
  missingSkills?: string[];
  skills: string[];
  potentialScore?: number;
  colors: ThemeColors;
}

export default function SkillAnalysisSection({
  session,
  matchedSkills,
  missingSkills,
  skills,
  potentialScore,
  colors,
}: Props) {
  const styles = makeStyles(colors);

  if (!session) {
    return (
      <View style={styles.skillAnalysis}>
        <Text style={styles.skillAnalysisTitle}>Beceri Analizi</Text>
        <TouchableOpacity
          onPress={() => router.push('/auth')}
          activeOpacity={0.75}
          style={styles.guestAnalysisBox}
        >
          <Ionicons name="sparkles" size={13} color={colors.accent} />
          <Text style={styles.guestAnalysisText}>
            Yeteneklerinizin bu ilana uyumunu görmek için giriş yapın →
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  let matched: string[] = [];
  let missing: string[] = [];

  if ((matchedSkills && matchedSkills.length > 0) || (missingSkills && missingSkills.length > 0)) {
    matched = (matchedSkills ?? []).slice(0, 3);
    missing = (missingSkills ?? []).slice(0, 2);
  } else if (skills && skills.length > 0) {
    skills.slice(0, 4).forEach((s) => {
      if (missingSkills?.includes(s)) {
        if (missing.length < 2) missing.push(s);
      } else {
        if (matched.length < 3) matched.push(s);
      }
    });
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
            {potentialScore
              ? `Bunları eklersen skorun %${potentialScore}'e çıkar:`
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
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
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
    guestAnalysisBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(5,22,80,0.03)',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginTop: 4,
    },
    guestAnalysisText: {
      color: c.textDim,
      fontSize: 12,
      fontWeight: '600',
      flex: 1,
    },
  });
}
