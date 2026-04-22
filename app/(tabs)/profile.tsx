import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useFeedStore } from '@/store/feedStore';
import { COLORS, FONT_SIZES, RADII, SPACING } from '@/constants/theme';

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, resetOnboarding } = useUserStore();
  const { savedJobs, appliedJobIds } = useFeedStore();

  const displayName = profile.name || 'Anonim';
  const initial = displayName.charAt(0).toUpperCase();

  function handleResetOnboarding() {
    resetOnboarding();
    router.replace('/onboarding/welcome');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Avatar + name */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {profile.title ? <Text style={styles.jobTitle}>{profile.title}</Text> : null}
          {profile.location ? (
            <Text style={styles.location}>📍 {profile.location}</Text>
          ) : null}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={savedJobs.length} label="Kaydedilen" />
          <View style={styles.statDivider} />
          <StatCard value={appliedJobIds.length} label="Başvurulan" />
          <View style={styles.statDivider} />
          <StatCard value={profile.skills.length} label="Yetenek" />
        </View>

        {/* Profile details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
          <View style={styles.card}>
            <InfoRow icon="👤" label="Ad Soyad" value={profile.name} />
            <View style={styles.cardDivider} />
            <InfoRow icon="💼" label="Ünvan" value={profile.title} />
            <View style={styles.cardDivider} />
            <InfoRow icon="📍" label="Konum" value={profile.location} />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tercihler</Text>
          <View style={styles.card}>
            <InfoRow
              icon="🏢"
              label="Çalışma Tipi"
              value={
                profile.preferences.workType === 'any'
                  ? 'Farketmez'
                  : profile.preferences.workType === 'remote'
                  ? 'Remote'
                  : profile.preferences.workType === 'hybrid'
                  ? 'Hibrit'
                  : 'Ofis'
              }
            />
            <View style={styles.cardDivider} />
            <InfoRow
              icon="📊"
              label="Kıdem"
              value={
                profile.preferences.seniority === 'junior'
                  ? 'Junior'
                  : profile.preferences.seniority === 'mid'
                  ? 'Mid-Level'
                  : profile.preferences.seniority === 'senior'
                  ? 'Senior'
                  : 'Lead'
              }
            />
            <View style={styles.cardDivider} />
            <InfoRow
              icon="🏙️"
              label="Şehir"
              value={profile.preferences.location || 'Belirtilmemiş'}
            />
          </View>
        </View>

        {/* Skills */}
        {profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yetenekler</Text>
            <View style={styles.skillsWrap}>
              {profile.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Edit preferences */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/onboarding/preferences')}
          activeOpacity={0.8}
        >
          <Text style={styles.editBtnText}>Tercihleri Düzenle</Text>
        </TouchableOpacity>

        {/* Reset */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleResetOnboarding}
          activeOpacity={0.8}
        >
          <Text style={styles.resetText}>Yeniden Kurulum</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '800',
  },
  name: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  jobTitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.xs,
  },
  location: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADII.lg,
    padding: SPACING.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.cardBorder,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADII.lg,
    overflow: 'hidden',
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
    padding: SPACING.md,
  },
  infoIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.xs,
    marginBottom: 2,
  },
  infoValue: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  skillChip: {
    backgroundColor: `${COLORS.accent}18`,
    borderWidth: 1,
    borderColor: `${COLORS.accent}44`,
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
  },
  skillText: {
    color: COLORS.accentLight,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  editBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADII.full,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
  },
  editBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  resetBtn: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADII.full,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
  },
  resetText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
});
