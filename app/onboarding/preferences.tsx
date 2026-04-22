import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { Seniority, WorkType } from '@/types';
import { COLORS, FONT_SIZES, GRADIENTS, RADII, SPACING } from '@/constants/theme';

const SECTORS = [
  'Yazılım & Teknoloji', 'E-ticaret', 'Fintech', 'Gaming',
  'SaaS', 'Lojistik', 'Sağlık', 'Eğitim', 'Medya', 'Üretim',
];

const WORK_TYPES: { value: WorkType | 'any'; label: string; icon: string }[] = [
  { value: 'any', label: 'Farketmez', icon: '🔀' },
  { value: 'remote', label: 'Remote', icon: '🌍' },
  { value: 'hybrid', label: 'Hibrit', icon: '🏠' },
  { value: 'office', label: 'Ofis', icon: '🏢' },
];

const SENIORITY_OPTIONS: { value: Seniority; label: string; desc: string }[] = [
  { value: 'junior', label: 'Junior', desc: '0–2 yıl' },
  { value: 'mid', label: 'Mid-Level', desc: '2–5 yıl' },
  { value: 'senior', label: 'Senior', desc: '5–8 yıl' },
  { value: 'lead', label: 'Lead / Principal', desc: '8+ yıl' },
];

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { profile, setPreferences } = useUserStore();
  const prefs = profile.preferences;

  const [sectors, setSectors] = useState<string[]>(prefs.sectors);
  const [workType, setWorkType] = useState<WorkType | 'any'>(prefs.workType);
  const [seniority, setSeniority] = useState<Seniority>(prefs.seniority);
  const [location, setLocation] = useState(prefs.location || 'İstanbul');

  function toggleSector(s: string) {
    setSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function handleContinue() {
    setPreferences({ sectors, workType, seniority, location });
    router.push('/onboarding/cv');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '50%', backgroundColor: COLORS.accent }]} />
        </View>
        <Text style={styles.step}>1/2</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Tercihlerin neler?</Text>
        <Text style={styles.subtitle}>Sana en uygun ilanları getireceğiz.</Text>

        {/* Sektör */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>İlgilendiğin Sektörler</Text>
          <View style={styles.chips}>
            {SECTORS.map((s) => {
              const active = sectors.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleSector(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Çalışma tipi */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Çalışma Tipi</Text>
          <View style={styles.optionGrid}>
            {WORK_TYPES.map((wt) => {
              const active = workType === wt.value;
              return (
                <TouchableOpacity
                  key={wt.value}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => setWorkType(wt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionIcon}>{wt.icon}</Text>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {wt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Kıdem */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Kıdem Seviyesi</Text>
          <View style={styles.seniorityList}>
            {SENIORITY_OPTIONS.map((opt) => {
              const active = seniority === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.seniorityRow, active && styles.seniorityActive]}
                  onPress={() => setSeniority(opt.value)}
                  activeOpacity={0.8}
                >
                  <View style={styles.seniorityInfo}>
                    <Text style={[styles.seniorityLabel, active && styles.seniorityLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.seniorityDesc}>{opt.desc}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Şehir */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Şehir</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="İstanbul, Ankara, Remote..."
            placeholderTextColor={COLORS.textDim}
          />
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <LinearGradient colors={GRADIENTS[0]} style={styles.ctaBtn}>
          <TouchableOpacity style={styles.ctaInner} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.ctaText}>Devam →</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: COLORS.white,
    fontSize: 22,
  },
  progress: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.cardBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  step: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    width: 28,
    textAlign: 'right',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.xl,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    marginTop: -SPACING.md,
  },
  section: {
    gap: SPACING.sm + 4,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 4,
    borderRadius: RADII.full,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chipActive: {
    backgroundColor: `${COLORS.accent}22`,
    borderColor: `${COLORS.accent}66`,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.accentLight,
  },
  optionGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  option: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADII.md,
    padding: SPACING.sm + 4,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  optionActive: {
    backgroundColor: `${COLORS.accent}18`,
    borderColor: `${COLORS.accent}55`,
  },
  optionIcon: {
    fontSize: 20,
  },
  optionLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionLabelActive: {
    color: COLORS.accentLight,
  },
  seniorityList: {
    gap: SPACING.sm,
  },
  seniorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADII.md,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  seniorityActive: {
    backgroundColor: `${COLORS.accent}18`,
    borderColor: `${COLORS.accent}55`,
  },
  seniorityInfo: {
    gap: 2,
  },
  seniorityLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  seniorityLabelActive: {
    color: COLORS.white,
  },
  seniorityDesc: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.xs,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: COLORS.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADII.md,
    padding: SPACING.md,
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
  footer: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  ctaBtn: {
    borderRadius: RADII.full,
    height: 56,
  },
  ctaInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
});
