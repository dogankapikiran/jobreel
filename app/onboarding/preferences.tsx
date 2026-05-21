import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { api } from '@/services/api';
import { Seniority, WorkType } from '@/types';
import { FONT_SIZES, RADII, SPACING } from '@/constants/theme';

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
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = edit === '1';

  const [sectors, setSectors] = useState<string[]>(prefs.sectors);
  const [workType, setWorkType] = useState<WorkType | 'any'>(prefs.workType);
  const [seniority, setSeniority] = useState<Seniority[]>(
    Array.isArray(prefs.seniority) ? prefs.seniority : prefs.seniority ? [prefs.seniority as unknown as Seniority] : []
  );
  const [location, setLocation] = useState(prefs.location || 'İstanbul');
  const [saving, setSaving] = useState(false);

  function toggleSector(s: string) {
    setSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleContinue() {
    setPreferences({ sectors, workType, seniority, location });
    if (isEditMode) {
      setSaving(true);
      api.updateProfile({
        preferences: {
          sectors,
          work_type: workType,
          seniority,
          location,
          salary_min: prefs.salaryMin,
          skills: prefs.skills,
        },
      }).catch(() => {}).finally(() => setSaving(false));
      router.back();
    } else {
      router.push('/onboarding/cv');
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        {!isEditMode && (
          <>
            <View style={styles.progress}>
              <View style={[styles.progressBar, { width: '50%' }]} />
            </View>
            <Text style={styles.step}>1/2</Text>
          </>
        )}
        {isEditMode && <Text style={styles.editTitle}>Tercihlerimi Düzenle</Text>}
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
          <Text style={styles.sectionLabel}>Kıdem Seviyesi (Çoklu Seçim)</Text>
          <View style={styles.seniorityList}>
            {SENIORITY_OPTIONS.map((opt) => {
              const active = seniority.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.seniorityRow, active && styles.seniorityActive]}
                  onPress={() => setSeniority(prev =>
                    prev.includes(opt.value) ? prev.filter(x => x !== opt.value) : [...prev, opt.value]
                  )}
                  activeOpacity={0.8}
                >
                  <View style={styles.seniorityInfo}>
                    <Text style={[styles.seniorityLabel, active && styles.seniorityLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.seniorityDesc}>{opt.desc}</Text>
                  </View>
                  <View style={[styles.checkbox, active && styles.checkboxActive]}>
                    {active && <Text style={styles.checkmark}>✓</Text>}
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
            placeholderTextColor="rgba(5,22,80,0.35)"
          />
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, saving && { opacity: 0.7 }]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.ctaText}>{isEditMode ? 'Kaydet ✓' : 'Devam →'}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef1f8',
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
    color: '#051650',
    fontSize: 22,
  },
  progress: {
    flex: 1,
    height: 3,
    backgroundColor: '#dde1ea',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#051650',
  },
  step: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    width: 28,
    textAlign: 'right',
  },
  editTitle: {
    flex: 1,
    color: '#051650',
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.xl,
  },
  title: {
    color: '#051650',
    fontSize: FONT_SIZES.title,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.md,
    marginTop: -SPACING.md,
  },
  section: {
    gap: SPACING.sm + 4,
  },
  sectionLabel: {
    color: '#8a94a6',
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dde1ea',
  },
  chipActive: {
    backgroundColor: '#051650',
    borderColor: '#051650',
  },
  chipText: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  optionGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  option: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dde1ea',
    borderRadius: RADII.md,
    padding: SPACING.sm + 4,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  optionActive: {
    backgroundColor: 'rgba(5,22,80,0.08)',
    borderColor: 'rgba(5,22,80,0.3)',
  },
  optionIcon: {
    fontSize: 20,
  },
  optionLabel: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionLabelActive: {
    color: '#051650',
    fontWeight: '700',
  },
  seniorityList: {
    gap: SPACING.sm,
  },
  seniorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dde1ea',
    borderRadius: RADII.md,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  seniorityActive: {
    backgroundColor: 'rgba(5,22,80,0.06)',
    borderColor: 'rgba(5,22,80,0.25)',
  },
  seniorityInfo: {
    gap: 2,
  },
  seniorityLabel: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  seniorityLabelActive: {
    color: '#051650',
  },
  seniorityDesc: {
    color: '#aab0bd',
    fontSize: FONT_SIZES.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#dde1ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: '#051650',
    backgroundColor: '#051650',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dde1ea',
    borderRadius: RADII.md,
    padding: SPACING.md,
    color: '#051650',
    fontSize: FONT_SIZES.md,
  },
  footer: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  ctaBtn: {
    height: 56,
    backgroundColor: '#051650',
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
});
