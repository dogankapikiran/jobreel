import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { useFeedStore } from '@/store/feedStore';
import { api, CvParsed } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { ACCENT_GRADIENT, BOTTOM_NAV_HEIGHT, FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

function StatCard({ value, label, colors }: { value: string | number; label: string; colors: ThemeColors }) {
  return (
    <View style={statStyles(colors).stat}>
      <Text style={statStyles(colors).statValue}>{value}</Text>
      <Text style={statStyles(colors).statLabel}>{label}</Text>
    </View>
  );
}

const statStyles = (colors: ThemeColors) => StyleSheet.create({
  stat: { flex: 1, alignItems: 'center', gap: SPACING.xs },
  statValue: { color: colors.accent, fontSize: FONT_SIZES.xl, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: FONT_SIZES.xs },
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { profile, setProfile, setPreferences } = useUserStore();
  const { savedJobs, appliedJobs } = useFeedStore();
  const signOut = useAuthStore((s) => s.signOut);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cvParsed, setCvParsed] = useState<CvParsed | null>(null);
  const [cvLoading, setCvLoading] = useState(false);

  const [draftName, setDraftName] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftLocation, setDraftLocation] = useState('');

  useEffect(() => {
    api.getProfile().then((data) => {
      if (data.display_name) setProfile({ name: data.display_name as string });
      if (data.title) setProfile({ title: data.title as string });
      if (data.avatar_url) setProfile({ avatarUrl: data.avatar_url as string });
      const prefs = data.preferences as Record<string, unknown> | undefined;
      if (prefs) {
        setPreferences({
          sectors: (prefs.sectors as string[]) || [],
          seniority: (prefs.seniority as string[]) || [],
          workType: (prefs.work_type as string) || 'any',
          location: (prefs.location as string) || 'İstanbul',
          salaryMin: (prefs.salary_min as number) || 0,
          skills: (prefs.skills as string[]) || [],
        });
      }
      if (data.cv_parsed) setCvParsed(data.cv_parsed as CvParsed);
    }).catch(() => {});
  }, []);

  function startEdit() {
    setDraftName(profile.name || '');
    setDraftTitle(profile.title || '');
    setDraftLocation(prefs.location || '');
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    setProfile({ name: draftName, title: draftTitle });
    setPreferences({ location: draftLocation });
    setEditing(false);
    setSaving(false);
    api.updateProfile({
      display_name: draftName,
      title: draftTitle,
      preferences: {
        location: draftLocation,
        work_type: prefs.workType,
        seniority: prefs.seniority,
        salary_min: prefs.salaryMin,
        sectors: prefs.sectors,
        skills: prefs.skills,
      },
    }).catch(() => {});
  }

  async function handlePickCv() {
    let DocumentPicker: typeof import('expo-document-picker');
    try {
      DocumentPicker = await import('expo-document-picker');
    } catch {
      Alert.alert('Hata', 'Doküman seçici bu cihazda desteklenmiyor.');
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setCvLoading(true);
    try {
      const file = result.assets[0];
      const { signedUrl } = await api.getCvUploadUrl();

      const fileResponse = await fetch(file.uri);
      const blob = await fileResponse.blob();
      const controller = new AbortController();
      const uploadTimeout = setTimeout(() => controller.abort(), 30000);
      try {
        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/pdf' },
          body: blob,
          signal: controller.signal,
        });
        clearTimeout(uploadTimeout);
        if (!uploadRes.ok) throw new Error(`Upload HTTP ${uploadRes.status}`);
      } catch (e) {
        clearTimeout(uploadTimeout);
        throw e;
      }

      const { parsed } = await api.parseCv();
      setCvParsed(parsed);

      if (parsed.skills && parsed.skills.length > 0) {
        const merged = Array.from(new Set([...skills, ...parsed.skills]));
        setProfile({ skills: merged });
        api.updateProfile({ skills: merged }).catch(() => {});
      }

      Alert.alert(
        'CV Yüklendi',
        `${parsed.skills?.length || 0} yetenek çıkarıldı. Feed eşleşme skorunuz güncellendi.`,
      );
    } catch {
      Alert.alert('Hata', 'CV yüklenemedi. Tekrar deneyin.');
    } finally {
      setCvLoading(false);
    }
  }

  async function handleViewCv() {
    try {
      const { signedUrl } = await api.getCvSignedUrl();
      await WebBrowser.openBrowserAsync(signedUrl);
    } catch {
      Alert.alert('Hata', 'CV açılamadı. Dosyayı tekrar yükleyin.');
    }
  }

  async function handleDisconnectLinkedIn() {
    try {
      await api.disconnectLinkedIn();
      setProfile({ linkedInConnected: false, linkedInName: undefined, linkedInHeadline: undefined, linkedInPhotoUrl: undefined });
    } catch {
      Alert.alert('Hata', 'LinkedIn bağlantısı kesilemedi.');
    }
  }

  async function handlePickAvatar() {
    let ImagePicker: typeof import('expo-image-picker');
    try {
      ImagePicker = await import('expo-image-picker');
    } catch {
      Alert.alert('Hata', 'Fotoğraf seçici bu cihazda desteklenmiyor.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri iznine ihtiyaç var.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingAvatar(true);
    try {
      const uri = result.assets[0].uri;
      const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
      const { signedUrl, publicUrl } = await api.getAvatarUploadUrl(ext);
      const imageResponse = await fetch(uri);
      const blob = await imageResponse.blob();
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': `image/${ext === 'jpg' ? 'jpeg' : ext}` },
      });
      if (!uploadResponse.ok) throw new Error(`Upload failed: ${uploadResponse.status}`);
      await api.updateProfile({ avatar_url: publicUrl });
      setProfile({ avatarUrl: publicUrl });
    } catch {
      Alert.alert('Hata', 'Fotoğraf yüklenemedi, tekrar deneyin.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  const skills = profile.skills ?? [];
  const prefs = profile.preferences ?? { sectors: [], seniority: [], workType: 'any', location: '', salaryMin: 0, skills: [] };

  const completionItems = [
    { label: 'Ad Soyad', points: 15, done: !!profile.name },
    { label: 'Ünvan', points: 10, done: !!profile.title },
    { label: 'Yetenek (en az 3)', points: 20, done: skills.length >= 3 },
    { label: 'Sektör tercihleri', points: 15, done: (prefs.sectors ?? []).length > 0 },
    { label: 'Fotoğraf', points: 10, done: !!profile.avatarUrl },
    { label: 'LinkedIn bağla', points: 15, done: !!profile.linkedInConnected },
    { label: 'CV Yükle', points: 10, done: !!cvParsed },
    { label: 'Konum', points: 5, done: !!prefs.location },
  ];
  const completionScore = completionItems.filter((i) => i.done).reduce((sum, i) => sum + i.points, 0);
  const firstMissing = completionItems.find((i) => !i.done);

  const displayName = profile.name || 'Anonim';
  const initial = displayName.charAt(0).toUpperCase();

  const workTypeLabel =
    prefs.workType === 'any' ? 'Farketmez' :
    prefs.workType === 'remote' ? 'Remote' :
    prefs.workType === 'hybrid' ? 'Hibrit' : 'Ofis';

  const seniorityLabelMap: Record<string, string> = { junior: 'Junior', mid: 'Mid-Level', senior: 'Senior', lead: 'Lead' };
  const seniorityLabel = (Array.isArray(prefs.seniority) ? prefs.seniority : [])
    .map(s => seniorityLabelMap[s] ?? s).join(', ') || 'Belirtilmemiş';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
          {editing ? (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={styles.saveBtn} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={colors.white} size="small" />
                  : <Text style={styles.saveText}>Kaydet</Text>
                }
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={startEdit} style={styles.editIconBtn}>
              <Text style={styles.editIconText}>✏️ Düzenle</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + SPACING.md }]} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.hero}>
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} style={styles.avatarWrap}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}
              {uploadingAvatar ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={colors.white} />
                </View>
              ) : (
                <View style={styles.avatarEditBadge}>
                  <Text style={styles.avatarEditIcon}>📷</Text>
                </View>
              )}
            </TouchableOpacity>

            {editing ? (
              <View style={styles.editFields}>
                <TextInput
                  style={styles.editInput}
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Ad Soyad"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="words"
                />
                <TextInput
                  style={styles.editInput}
                  value={draftTitle}
                  onChangeText={setDraftTitle}
                  placeholder="Ünvan (örn. Senior Developer)"
                  placeholderTextColor={colors.textDim}
                />
                <TextInput
                  style={styles.editInput}
                  value={draftLocation}
                  onChangeText={setDraftLocation}
                  placeholder="Şehir (örn. İstanbul)"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            ) : (
              <>
                <Text style={styles.name}>{displayName}</Text>
                {profile.title ? <Text style={styles.jobTitle}>{profile.title}</Text> : null}
                {prefs.location ? (
                  <Text style={styles.location}>📍 {prefs.location}</Text>
                ) : null}
              </>
            )}
          </View>

          {/* Profil Tamamlanma */}
          {completionScore < 100 && (
            <View style={styles.completionCard}>
              <View style={styles.completionHeader}>
                <Text style={styles.completionTitle}>Profil Tamamlanma</Text>
                <Text style={styles.completionScore}>{completionScore}%</Text>
              </View>
              <View style={styles.completionBar}>
                <LinearGradient
                  colors={ACCENT_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.completionFill, { width: `${completionScore}%` }]}
                />
              </View>
              {firstMissing && (
                <Text style={styles.completionHint}>
                  {firstMissing.label} ekle → +{firstMissing.points} puan
                </Text>
              )}
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard value={savedJobs.length} label="Kaydedilen" colors={colors} />
            <View style={styles.statDivider} />
            <StatCard value={appliedJobs.length} label="Başvurulan" colors={colors} />
            <View style={styles.statDivider} />
            <StatCard value={skills.length} label="Yetenek" colors={colors} />
          </View>

          {/* Preferences summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tercihler</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🏢</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Çalışma Tipi</Text>
                  <Text style={styles.infoValue}>{workTypeLabel}</Text>
                </View>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📊</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Kıdem</Text>
                  <Text style={styles.infoValue}>{seniorityLabel}</Text>
                </View>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🏙️</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Şehir</Text>
                  <Text style={styles.infoValue}>{prefs.location || 'Belirtilmemiş'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Skills */}
          {skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Yetenekler</Text>
              <View style={styles.skillsWrap}>
                {skills.map((skill) => (
                  <View key={skill} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* CV */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CV / Özgeçmiş</Text>
            {cvParsed ? (
              <TouchableOpacity style={styles.card} onPress={handleViewCv} activeOpacity={0.7}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📄</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoValue}>{cvParsed.title || 'CV yüklendi'}</Text>
                    <Text style={styles.infoLabel}>
                      {cvParsed.skills?.length || 0} yetenek · {cvParsed.experience?.length || 0} deneyim
                    </Text>
                  </View>
                  {cvLoading ? (
                    <ActivityIndicator size="small" color={colors.textDim} />
                  ) : (
                    <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                      <Text style={styles.linkedInDisconnect}>Görüntüle</Text>
                      <TouchableOpacity onPress={handlePickCv} hitSlop={8}>
                        <Text style={styles.linkedInDisconnect}>Güncelle</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.cvUploadBtn}
                onPress={handlePickCv}
                activeOpacity={0.8}
                disabled={cvLoading}
              >
                {cvLoading ? (
                  <ActivityIndicator color={colors.accent} />
                ) : (
                  <>
                    <Text style={styles.cvUploadIcon}>📄</Text>
                    <View>
                      <Text style={styles.cvUploadText}>CV Yükle (PDF)</Text>
                      <Text style={styles.cvUploadSub}>İlan eşleşme skorunuzu artırın</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* LinkedIn */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LinkedIn</Text>
            {profile.linkedInConnected ? (
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <View style={styles.linkedInBadge}>
                    <Text style={styles.linkedInBadgeText}>in</Text>
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoValue}>{profile.linkedInName}</Text>
                    {profile.linkedInHeadline
                      ? <Text style={styles.infoLabel}>{profile.linkedInHeadline}</Text>
                      : null}
                  </View>
                  <TouchableOpacity onPress={handleDisconnectLinkedIn} hitSlop={8}>
                    <Text style={styles.linkedInDisconnect}>Kes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.linkedInBtn}
                onPress={() => router.push('/linkedin-connect')}
                activeOpacity={0.8}
              >
                <Text style={styles.linkedInBtnText}>LinkedIn Profilini Bağla</Text>
                <Text style={styles.linkedInBtnSub}>Adını, ünvanını ve fotoğrafını otomatik doldur</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.editPrefsBtn}
            onPress={() => router.push('/onboarding/preferences?edit=1')}
            activeOpacity={0.8}
          >
            <Text style={styles.editPrefsBtnText}>Tercihleri Düzenle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsBtnText}>Ayarlar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={async () => { await signOut(); router.replace('/auth'); }}
            activeOpacity={0.8}
          >
            <Text style={styles.signOutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerTitle: {
    color: colors.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', gap: SPACING.sm },
  cancelBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cancelText: { color: colors.textMuted, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  saveBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.full,
    backgroundColor: colors.accent,
    minWidth: 68,
    alignItems: 'center',
  },
  saveText: { color: colors.white, fontSize: FONT_SIZES.sm, fontWeight: '700' },
  editIconBtn: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.full,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  editIconText: { color: colors.textMuted, fontSize: FONT_SIZES.sm },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  hero: { alignItems: 'center', paddingVertical: SPACING.md },
  avatarWrap: { position: 'relative', marginBottom: SPACING.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditIcon: { fontSize: 14 },
  avatarText: { color: colors.white, fontSize: 32, fontWeight: '800' },
  editFields: { width: '100%', gap: SPACING.sm, marginTop: SPACING.sm },
  editInput: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: colors.text,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  name: {
    color: colors.text, fontSize: FONT_SIZES.xl,
    fontWeight: '800', letterSpacing: -0.5,
  },
  jobTitle: { color: colors.textMuted, fontSize: FONT_SIZES.md, marginTop: SPACING.xs },
  location: { color: colors.textDim, fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: RADII.lg, padding: SPACING.md,
  },
  statDivider: { width: 1, backgroundColor: colors.cardBorder },
  section: { gap: SPACING.sm },
  sectionTitle: {
    color: colors.textMuted, fontSize: FONT_SIZES.xs,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.cardBg, borderWidth: 1,
    borderColor: colors.cardBorder, borderRadius: RADII.lg, overflow: 'hidden',
  },
  cardDivider: { height: 1, backgroundColor: colors.cardBorder },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm + 4, padding: SPACING.md,
  },
  infoIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { color: colors.textDim, fontSize: FONT_SIZES.xs, marginBottom: 2 },
  infoValue: { color: colors.text, fontSize: FONT_SIZES.sm, fontWeight: '500' },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  skillChip: {
    backgroundColor: `${colors.accent}18`, borderWidth: 1,
    borderColor: `${colors.accent}44`, borderRadius: RADII.full,
    paddingHorizontal: SPACING.sm + 4, paddingVertical: SPACING.xs + 2,
  },
  skillText: { color: colors.accentLight, fontSize: FONT_SIZES.xs, fontWeight: '500' },
  editPrefsBtn: {
    backgroundColor: colors.accent, borderRadius: RADII.full,
    paddingVertical: SPACING.sm + 4, alignItems: 'center',
  },
  editPrefsBtnText: { color: colors.white, fontSize: FONT_SIZES.md, fontWeight: '700' },
  settingsBtn: {
    backgroundColor: colors.cardBg, borderWidth: 1,
    borderColor: colors.cardBorder, borderRadius: RADII.full,
    paddingVertical: SPACING.sm + 4, alignItems: 'center',
  },
  settingsBtnText: { color: colors.text, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  signOutBtn: {
    backgroundColor: 'rgba(255,59,48,0.1)', borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.25)', borderRadius: RADII.full,
    paddingVertical: SPACING.sm + 4, alignItems: 'center',
  },
  signOutText: { color: '#ff3b30', fontSize: FONT_SIZES.sm, fontWeight: '600' },
  cvUploadBtn: {
    backgroundColor: `${colors.accent}10`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    justifyContent: 'center',
  },
  cvUploadIcon: { fontSize: 24 },
  cvUploadText: { color: colors.accent, fontSize: FONT_SIZES.md, fontWeight: '700' },
  cvUploadSub: { color: colors.textDim, fontSize: FONT_SIZES.xs, marginTop: 2 },
  linkedInBtn: {
    backgroundColor: 'rgba(10, 102, 194, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(10, 102, 194, 0.3)',
    borderRadius: RADII.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  linkedInBtnText: { color: '#4A9EDB', fontSize: FONT_SIZES.md, fontWeight: '700' },
  linkedInBtnSub: { color: colors.textDim, fontSize: FONT_SIZES.xs },
  linkedInBadge: {
    width: 30, height: 30, borderRadius: 6,
    backgroundColor: '#0A66C2',
    alignItems: 'center', justifyContent: 'center',
  },
  linkedInBadgeText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  linkedInDisconnect: { color: colors.textDim, fontSize: FONT_SIZES.xs },
  completionCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionTitle: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  completionScore: {
    color: colors.accent,
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
  },
  completionBar: {
    height: 6,
    backgroundColor: `${colors.accent}22`,
    borderRadius: RADII.full,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    borderRadius: RADII.full,
  },
  completionHint: {
    color: colors.textDim,
    fontSize: FONT_SIZES.xs,
  },
});
