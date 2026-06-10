import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { Seniority, WorkType } from '@/types';

interface Props {
  prefs: {
    sectors: string[];
    seniority: Seniority[];
    workType: WorkType;
    location?: string;
  };
  colors: ThemeColors;
}

const WT_LABEL: Record<string, string> = {
  any: 'Farketmez',
  remote: 'Remote',
  hybrid: 'Hibrit',
  office: 'Ofis',
};

const seniorityLabelMap: Record<string, string> = {
  junior: 'Junior',
  mid: 'Mid-Level',
  senior: 'Senior',
  lead: 'Lead',
};

export default function ProfilePreferences({ prefs, colors }: Props) {
  const router = useRouter();
  const styles = makeStyles(colors);

  const workTypeDisplay = (() => {
    const wtStr = typeof prefs.workType === 'string' ? prefs.workType : 'any';
    if (wtStr === 'any' || !wtStr) return 'Farketmez';
    if (wtStr.includes(',')) {
      return wtStr.split(',').map((v) => WT_LABEL[v.trim()] ?? v).join(', ');
    }
    return WT_LABEL[wtStr] ?? 'Belirtilmemiş';
  })();

  const seniorityLabel = (Array.isArray(prefs.seniority) ? prefs.seniority : [])
    .map((s) => seniorityLabelMap[s] ?? s)
    .join(', ') || 'Belirtilmemiş';

  const sectorsJoined = (Array.isArray(prefs.sectors) ? prefs.sectors : []).join(', ');

  return (
    <View style={styles.section}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Tercihler</Text>
        <TouchableOpacity
          onPress={() => router.push('/onboarding/preferences?edit=1' as Href)}
          activeOpacity={0.7}
          style={styles.sectionEditBtn}
        >
          <Text style={[styles.sectionEditText, { color: colors.isDark ? colors.textMuted : colors.accent }]}>
            Düzenle
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏷️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Sektörler</Text>
            {sectorsJoined ? (
              <Text style={[styles.infoValue, { color: colors.text }]}>{sectorsJoined}</Text>
            ) : (
              <Text style={[styles.infoValue, { color: colors.textDim }]}>Belirtilmemiş</Text>
            )}
          </View>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏢</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Çalışma Tipi</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{workTypeDisplay}</Text>
          </View>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📊</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Kıdem</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{seniorityLabel}</Text>
          </View>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏙️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Şehir</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{prefs.location || 'Belirtilmemiş'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    section: { gap: SPACING.sm },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    sectionEditBtn: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: RADII.full,
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    sectionEditText: {
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
    card: {
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.lg,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0.2 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    cardDivider: { height: 1, backgroundColor: c.cardBorder },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm + 4,
      padding: SPACING.md,
    },
    infoIcon: { fontSize: 18, width: 24, textAlign: 'center' },
    infoContent: { flex: 1 },
    infoLabel: { color: c.textMuted, fontSize: FONT_SIZES.xs, marginBottom: 2 },
    infoValue: { fontSize: FONT_SIZES.sm, fontWeight: '500' },
  });
}
