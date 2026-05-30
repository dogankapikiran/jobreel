import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const SUGGESTED_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Node.js',
  'Python', 'Java', 'Swift', 'Kotlin', 'Go',
  'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Figma', 'Product Management', 'Data Science',
];

export default function CvScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { profile, setProfile, setPreferences, completeOnboarding, markOnboardingComplete } = useUserStore();
  const session = useAuthStore((s) => s.session);

  const [name, setName] = useState(profile.name);
  const [title, setTitle] = useState(profile.title);
  const [summary, setSummary] = useState(profile.summary);
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [customSkill, setCustomSkill] = useState('');

  function toggleSkill(s: string) {
    setSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function addCustomSkill() {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkill('');
  }

  function handleFinish() {
    setProfile({ name, title, summary, skills });
    setPreferences({ skills });
    completeOnboarding();
    if (session?.user.id) markOnboardingComplete(session.user.id);
    api.updateProfile({
      display_name: name,
      title,
      preferences: {
        sectors: profile.preferences.sectors,
        work_type: profile.preferences.workType,
        seniority: profile.preferences.seniority,
        location: profile.preferences.location,
        skills,
      },
    }).catch(() => {});
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.progress}>
            <View style={[styles.progressBar, { width: '100%' }]} />
          </View>
          <Text style={styles.step}>3/3</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Kendini tanıt</Text>
          <Text style={styles.subtitle}>Bu bilgiler algoritmanın seni daha iyi tanımasını sağlar.</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Adın Soyadın"
              placeholderTextColor={colors.textDim}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Örn: Senior Frontend Developer"
              placeholderTextColor={colors.textDim}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Kısa Özet (opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={summary}
              onChangeText={setSummary}
              placeholder="Birkaç cümleyle kendini anlat..."
              placeholderTextColor={colors.textDim}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Yeteneklerin</Text>
            <View style={styles.skillInputRow}>
              <TextInput
                style={[styles.input, styles.skillInput]}
                value={customSkill}
                onChangeText={setCustomSkill}
                placeholder="Yetenek ekle..."
                placeholderTextColor={colors.textDim}
                onSubmitEditing={addCustomSkill}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addCustomSkill} activeOpacity={0.8}>
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chips}>
              {SUGGESTED_SKILLS.map((s) => {
                const active = skills.includes(s);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleSkill(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
              {skills
                .filter((s) => !SUGGESTED_SKILLS.includes(s))
                .map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, styles.chipActive]}
                    onPress={() => toggleSkill(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, styles.chipTextActive]}>{s} ✕</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleFinish} activeOpacity={0.85}>
            <Text style={styles.ctaText}>İlan Akışına Geç →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFinish} activeOpacity={0.7}>
            <Text style={styles.skipText}>Haydi Başla!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrapper: { flex: 1 },
    screen: {
      flex: 1,
      backgroundColor: c.bg,
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
      color: c.text,
      fontSize: 22,
    },
    progress: {
      flex: 1,
      height: 3,
      backgroundColor: c.cardBorder,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: c.isDark ? c.textMuted : c.accent,
    },
    step: {
      color: c.textMuted,
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
      color: c.text,
      fontSize: FONT_SIZES.title,
      fontWeight: '800',
      letterSpacing: -0.8,
    },
    subtitle: {
      color: c.textMuted,
      fontSize: FONT_SIZES.md,
      marginTop: -SPACING.md,
    },
    section: { gap: SPACING.sm },
    label: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    input: {
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      padding: SPACING.md,
      color: c.text,
      fontSize: FONT_SIZES.md,
    },
    textArea: {
      minHeight: 80,
      paddingTop: SPACING.md,
    },
    skillInputRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    skillInput: { flex: 1 },
    addBtn: {
      width: 52,
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnText: {
      color: '#ffffff',
      fontSize: 24,
      fontWeight: '300',
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
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    chipActive: {
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderColor: c.isDark ? 'rgba(255,255,255,0.25)' : c.accent,
    },
    chipText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.sm,
      fontWeight: '500',
    },
    chipTextActive: {
      color: '#ffffff',
    },
    footer: {
      padding: SPACING.lg,
      paddingTop: SPACING.sm,
      gap: SPACING.sm,
      alignItems: 'center',
    },
    ctaBtn: {
      width: '100%',
      height: 56,
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
      borderRadius: RADII.full,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: c.isDark ? 0 : 0.28,
      shadowRadius: 14,
      elevation: c.isDark ? 0 : 4,
    },
    ctaText: {
      color: '#ffffff',
      fontSize: FONT_SIZES.lg,
      fontWeight: '800',
    },
    skipText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.sm,
    },
  });
}
