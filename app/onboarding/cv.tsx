import React, { useState } from 'react';
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
import { api } from '@/services/api';
import { FONT_SIZES, RADII, SPACING } from '@/constants/theme';

const SUGGESTED_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Node.js',
  'Python', 'Java', 'Swift', 'Kotlin', 'Go',
  'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Figma', 'Product Management', 'Data Science',
];

export default function CvScreen() {
  const insets = useSafeAreaInsets();
  const { profile, setProfile, setPreferences, completeOnboarding } = useUserStore();

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
    router.replace('/(tabs)');
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
          <Text style={styles.step}>2/2</Text>
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
              placeholderTextColor="rgba(5,22,80,0.35)"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Mevcut / Hedef Ünvan</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Örn: Senior Frontend Developer"
              placeholderTextColor="rgba(5,22,80,0.35)"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Kısa Özet (opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={summary}
              onChangeText={setSummary}
              placeholder="Birkaç cümleyle kendini anlat..."
              placeholderTextColor="rgba(5,22,80,0.35)"
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
                placeholderTextColor="rgba(5,22,80,0.35)"
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
            <Text style={styles.skipText}>Şimdilik atla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
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
  section: { gap: SPACING.sm },
  label: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    backgroundColor: '#051650',
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
  footer: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  ctaBtn: {
    width: '100%',
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
  skipText: {
    color: '#8a94a6',
    fontSize: FONT_SIZES.sm,
  },
});
