import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ACCENT_GRADIENT, FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import type { CvParsed } from '@/services/api';

interface Props {
  profile: {
    name?: string;
    title?: string;
    avatarUrl?: string;
    skills?: string[];
  };
  prefs: {
    sectors?: string[];
    location?: string;
  };
  cvParsed: CvParsed | null;
  colors: ThemeColors;
}

export default function ProfileCompletion({ profile, prefs, cvParsed, colors }: Props) {
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  
  const completionItems = [
    { label: 'Ad Soyad', points: 20, done: !!profile.name },
    { label: 'Ünvan', points: 10, done: !!profile.title },
    { label: 'Yetenek (en az 3)', points: 25, done: skills.length >= 3 },
    { label: 'Sektör tercihleri', points: 20, done: (Array.isArray(prefs.sectors) ? prefs.sectors : []).length > 0 },
    { label: 'Fotoğraf', points: 10, done: !!profile.avatarUrl },
    { label: 'CV Yükle', points: 10, done: !!cvParsed },
    { label: 'Konum', points: 5, done: !!prefs.location },
  ];
  
  const completionScore = completionItems.filter((i) => i.done).reduce((sum, i) => sum + i.points, 0);
  const missingItems = completionItems.filter((i) => !i.done);
  
  const styles = makeStyles(colors);

  if (completionScore >= 100) {
    return (
      <View style={styles.completionComplete}>
        <Ionicons name="checkmark-circle" size={18} color="#2ecc71" />
        <Text style={styles.completionCompleteText}>Profil %100 tamamlandı</Text>
      </View>
    );
  }

  return (
    <View style={styles.completionCard}>
      <View style={styles.completionHeader}>
        <Text style={styles.completionTitle}>Profil Tamamlanma</Text>
        <Text style={[styles.completionScore, { color: colors.text }]}>{completionScore}%</Text>
      </View>
      <View style={[styles.completionBar, { backgroundColor: colors.cardBorder }]}>
        <LinearGradient
          colors={ACCENT_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.completionFill, { width: `${completionScore}%` }]}
        />
      </View>
      {missingItems.slice(0, 3).map((item) => (
        <Text key={item.label} style={[styles.completionHint, { color: colors.textMuted }]}>
          {item.label} ekle → +{item.points} puan
        </Text>
      ))}
      {missingItems.length > 3 && (
        <Text style={[styles.completionHint, { color: colors.textMuted }]}>+{missingItems.length - 3} madde daha...</Text>
      )}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    completionCard: {
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.lg,
      padding: SPACING.md,
      gap: SPACING.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0.2 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    completionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    completionTitle: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    completionScore: {
      fontSize: FONT_SIZES.md,
      fontWeight: '800',
    },
    completionBar: {
      height: 6,
      borderRadius: RADII.full,
      overflow: 'hidden',
    },
    completionFill: {
      height: '100%',
      borderRadius: RADII.full,
    },
    completionHint: {
      fontSize: FONT_SIZES.xs,
    },
    completionComplete: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      backgroundColor: 'rgba(46,204,113,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(46,204,113,0.25)',
      borderRadius: RADII.lg,
      padding: SPACING.md,
    },
    completionCompleteText: {
      color: '#2ecc71',
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
    },
  });
}
