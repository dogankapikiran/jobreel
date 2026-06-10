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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Href, router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { useSavedStore } from '@/store/savedStore';
import { useApplicationStore } from '@/store/applicationStore';
import { api, CvParsed } from '@/services/api';
import { BOTTOM_NAV_HEIGHT, FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { Seniority, WorkType } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import AuthGate from '@/components/AuthGate';

// Extracted Constants
import { SUGGESTED_SKILLS, SECTOR_SKILLS } from '@/constants/skills';

// Extracted Subcomponents
import StatCard from '@/components/profile/StatCard';
import ProfileCompletion from '@/components/profile/ProfileCompletion';
import ProfilePreferences from '@/components/profile/ProfilePreferences';
import SkillsEditorModal from '@/components/profile/SkillsEditorModal';
import CvSection from '@/components/profile/CvSection';

export default function ProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { profile, setProfile, setPreferences } = useUserStore();
  const { savedJobs } = useSavedStore();
  const { appliedJobs } = useApplicationStore();

  const signOut = useAuthStore((s) => s.signOut);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cvParsed, setCvParsed] = useState<CvParsed | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [showSkillsEditor, setShowSkillsEditor] = useState(false);

  const [draftName, setDraftName] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftLocation, setDraftLocation] = useState('');

  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const prefs = profile.preferences ?? { sectors: [], seniority: [], workType: 'any' as WorkType, location: 'İstanbul', salaryMin: 0, skills: [] };

  useEffect(() => {
    if (!session) return;
    api.getProfile().then((data) => {
      if (!data) return;
      if (data.display_name) setProfile({ name: data.display_name as string });
      if (data.title) setProfile({ title: data.title as string });
      if (data.avatar_url) setProfile({ avatarUrl: data.avatar_url as string });
      const prefsData = data.preferences as Record<string, unknown> | undefined;
      if (prefsData) {
        const rawWorkType = typeof prefsData.work_type === 'string' ? prefsData.work_type : 'any';
        const parsedWorkTypes =
          rawWorkType !== 'any'
            ? (rawWorkType.split(',').map((s) => s.trim()).filter(Boolean) as WorkType[])
            : [];
        setPreferences({
          sectors: Array.isArray(prefsData.sectors) ? (prefsData.sectors as string[]) : [],
          seniority: Array.isArray(prefsData.seniority) ? (prefsData.seniority as Seniority[]) : [],
          workType: rawWorkType as WorkType,
          workTypes: parsedWorkTypes.length > 0 && parsedWorkTypes.length < 3 ? parsedWorkTypes : undefined,
          location: typeof prefsData.location === 'string' ? prefsData.location : 'İstanbul',
          salaryMin: typeof prefsData.salary_min === 'number' ? prefsData.salary_min : 0,
          skills: Array.isArray(prefsData.skills) ? (prefsData.skills as string[]) : [],
        });
      }
      if (data.cv_parsed) setCvParsed(data.cv_parsed as CvParsed);
    }).catch((err) => {
      console.warn('[Profile] Failed to fetch profile from API:', err);
    });
  }, []);

  function startEdit() {
    setDraftName(profile.name || '');
    setDraftTitle(profile.title || '');
    setDraftLocation(prefs.location || '');
    setEditing(true);
  }

  async function saveEdit() {
    if (!draftName.trim()) {
      Alert.alert('Hata', 'Ad Soyad boş bırakılamaz.');
      return;
    }
    const prevName = profile.name;
    const prevTitle = profile.title;
    const prevLocation = prefs.location;

    setSaving(true);
    setProfile({ name: draftName, title: draftTitle });
    setPreferences({ location: draftLocation });
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
        cities: prefs.cities,
      },
    }).then(() => {
      setEditing(false);
    }).catch(() => {
      setProfile({ name: prevName, title: prevTitle });
      setPreferences({ location: prevLocation });
      setDraftName(prevName || '');
      setDraftTitle(prevTitle || '');
      setDraftLocation(prevLocation || '');
      Alert.alert('Bağlantı Hatası', 'Profil kaydedilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.');
    }).finally(() => {
      setSaving(false);
    });
  }

  async function handlePickCv() {
    let getDocumentAsync: typeof import('expo-document-picker').getDocumentAsync;
    try {
      const mod = await import('expo-document-picker');
      getDocumentAsync = mod.getDocumentAsync;
      if (typeof getDocumentAsync !== 'function') throw new Error('not available');
    } catch {
      Alert.alert('Hata', 'Doküman seçici bu cihazda desteklenmiyor. Uygulamayı yeniden yükleyin.');
      return;
    }
    const result = await getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    if (file.size && file.size > 10 * 1024 * 1024) {
      Alert.alert('Dosya Çok Büyük', 'CV dosyası en fazla 10 MB olabilir. Daha küçük bir PDF seçin.');
      return;
    }

    setCvLoading(true);
    try {
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

      if (parsed.skills && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
        const merged = Array.from(new Set([...skills, ...parsed.skills]));
        setProfile({ skills: merged });
        api.updateProfile({ skills: merged }).catch(() => {});
      }

      Alert.alert(
        'CV Yüklendi',
        `${parsed.skills?.length || 0} yetenek çıkarıldı. Feed eşleşme skorunuz güncellenedi.`,
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

  async function handlePickAvatar() {
    let ImagePicker: typeof import('expo-image-picker');
    try {
      const raw = require('expo-image-picker');
      ImagePicker = raw?.default ?? raw;
      if (!ImagePicker || typeof ImagePicker.requestMediaLibraryPermissionsAsync !== 'function') {
        throw new Error('Native module ExponentImagePicker is not installed or linked');
      }
    } catch {
      Alert.alert('Hata', 'Profil fotoğrafı değiştirmek için App Store\'dan güncel versiyonu kullanın.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri iznine ihtiyaç var.');
      return;
    }

    const isPad = Platform.OS === 'ios' && Platform.isPad;
    const pickerOptions: Parameters<typeof ImagePicker.launchImageLibraryAsync>[0] = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: !isPad,
      aspect: [1, 1],
      quality: 0.7,
    };

    let result: Awaited<ReturnType<typeof ImagePicker.launchImageLibraryAsync>>;
    try {
      result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    } catch {
      Alert.alert('Hata', 'Fotoğraf seçilirken bir sorun oluştu.');
      return;
    }
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

  async function saveSkills(newSkills: string[]) {
    const prevSkills = profile.skills ?? [];
    const prevPrefSkills = prefs.skills ?? [];
    setProfile({ skills: newSkills });
    setPreferences({ skills: newSkills });
    try {
      await api.updateProfile({
        skills: newSkills,
        preferences: {
          sectors: prefs.sectors,
          work_type: prefs.workType,
          seniority: prefs.seniority,
          location: prefs.location,
          salary_min: prefs.salaryMin,
          skills: newSkills,
        },
      });
      setShowSkillsEditor(false);
    } catch {
      setProfile({ skills: prevSkills });
      setPreferences({ skills: prevPrefSkills });
      Alert.alert('Bağlantı Hatası', 'Yetenekler kaydedilemedi. Tekrar deneyin.');
    }
  }

  const suggestedSkills = useMemo(() => {
    const userSectors = Array.isArray(prefs.sectors) ? prefs.sectors : [];
    if (userSectors.length === 0) return SUGGESTED_SKILLS;
    const sectorSkills = Array.from(new Set(userSectors.flatMap((s) => SECTOR_SKILLS[s] ?? [])));
    const prioritized = sectorSkills.filter((s) => SUGGESTED_SKILLS.includes(s));
    const rest = SUGGESTED_SKILLS.filter((s) => !prioritized.includes(s));
    return [...prioritized, ...rest];
  }, [prefs.sectors]);

  const displayName = profile.name || 'Anonim';
  const initial = displayName.charAt(0).toUpperCase();

  if (!session) {
    return (
      <AuthGate
        icon="person-outline"
        title="Profil"
        description="Profil bilgilerinizi düzenlemek, özgeçmişinizi yüklemek ve yetenek analizinizi yapmak için giriş yapın."
      />
    );
  }

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
              <TouchableOpacity
                onPress={() => setEditing(false)}
                style={styles.cancelBtn}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Düzenlemeyi iptal et"
              >
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                style={styles.saveBtn}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Profili kaydet"
              >
                {saving
                  ? <ActivityIndicator color="#ffffff" size="small" />
                  : <Text style={styles.saveText}>Kaydet</Text>
                }
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={startEdit}
              style={styles.editIconBtn}
              accessibilityRole="button"
              accessibilityLabel="Profili düzenle"
            >
              <Text style={styles.editIconText}>Düzenle</Text>
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
                  <ActivityIndicator color="#ffffff" />
                </View>
              ) : (
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera-outline" size={14} color={colors.text} />
                </View>
              )}
            </TouchableOpacity>

            {editing ? (
              <View style={styles.editFields}>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, color: colors.text }]}
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Ad Soyad"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="words"
                />
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, color: colors.text }]}
                  value={draftTitle}
                  onChangeText={setDraftTitle}
                  placeholder="Ünvan (örn. Senior Developer)"
                  placeholderTextColor={colors.textDim}
                />
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, color: colors.text }]}
                  value={draftLocation}
                  onChangeText={setDraftLocation}
                  placeholder="Şehir (örn. İstanbul)"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            ) : (
              <>
                <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
                {profile.title ? <Text style={[styles.jobTitle, { color: colors.textMuted }]}>{profile.title}</Text> : null}
                {prefs.location ? (
                  <Text style={[styles.location, { color: colors.textMuted }]}>📍 {prefs.location}</Text>
                ) : null}
              </>
            )}
          </View>

          {/* Profil Tamamlanma */}
          <ProfileCompletion
            profile={profile}
            prefs={prefs}
            cvParsed={cvParsed}
            colors={colors}
          />

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.bgDeep, borderColor: colors.cardBorder }]}>
            <StatCard value={savedJobs.length} label="Kaydedilen" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
            <StatCard value={appliedJobs.length} label="Başvurulan" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
            <StatCard value={skills.length} label="Yetenek" colors={colors} />
          </View>

          {/* Preferences summary */}
          <ProfilePreferences prefs={prefs} colors={colors} />

          {/* Skills */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Yetenekler</Text>
              <TouchableOpacity onPress={() => setShowSkillsEditor(true)} activeOpacity={0.7} style={styles.sectionEditBtn}>
                <Text style={[styles.sectionEditText, { color: colors.isDark ? colors.textMuted : colors.accent }]}>Düzenle</Text>
              </TouchableOpacity>
            </View>
            {skills.length > 0 ? (
              <View style={styles.skillsWrap}>
                {skills.map((skill) => (
                  <View key={skill} style={[styles.skillChip, { backgroundColor: colors.bgDeep, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.skillText, { color: colors.text }]}>{skill}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.sectionEmpty, { color: colors.textDim }]}>Henüz yetenek eklenmedi.</Text>
            )}
          </View>

          {/* CV */}
          <CvSection
            cvParsed={cvParsed}
            cvLoading={cvLoading}
            colors={colors}
            onPickCv={handlePickCv}
            onViewCv={handleViewCv}
          />

          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.bgDeep, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/job-alerts')}
            activeOpacity={0.8}
          >
            <Text style={[styles.settingsBtnText, { color: colors.text }]}>İş İlanı Uyarısı</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.bgDeep, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}
          >
            <Text style={[styles.settingsBtnText, { color: colors.text }]}>Ayarlar</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={() => {
              Alert.alert(
                'Çıkış Yap',
                'Hesabından çıkmak istediğinden emin misin?',
                [
                  { text: 'İptal', style: 'cancel' },
                  { text: 'Çıkış Yap', style: 'destructive', onPress: async () => { await signOut(); router.replace('/auth'); } },
                ],
              );
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.signOutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Yetenekler Editor Bottom Sheet */}
        <SkillsEditorModal
          visible={showSkillsEditor}
          colors={colors}
          insets={insets}
          initialSkills={skills}
          suggestedSkills={suggestedSkills}
          onSave={saveSkills}
          onClose={() => setShowSkillsEditor(false)}
        />

      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: c.cardBorder,
    },
    headerTitle: {
      color: c.text,
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
      borderColor: c.cardBorder,
      backgroundColor: c.bgDeep,
    },
    cancelText: { color: c.textMuted, fontSize: FONT_SIZES.sm, fontWeight: '600' },
    saveBtn: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADII.full,
      backgroundColor: c.accent,
      borderWidth: 0,
      minWidth: 68,
      alignItems: 'center',
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.isDark ? 0.15 : 0.22,
      shadowRadius: 8,
      elevation: 3,
    },
    saveText: { color: '#ffffff', fontSize: FONT_SIZES.sm, fontWeight: '700' },
    editIconBtn: {
      paddingHorizontal: SPACING.sm + 4,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADII.full,
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: c.isDark ? 0 : 0.06,
      shadowRadius: 4,
      elevation: c.isDark ? 0 : 1,
    },
    editIconText: { color: c.textMuted, fontSize: FONT_SIZES.sm },
    content: {
      padding: SPACING.lg,
      paddingBottom: SPACING.xxl,
      gap: SPACING.lg,
    },
    hero: { alignItems: 'center', paddingVertical: SPACING.md },
    avatarWrap: { position: 'relative', marginBottom: SPACING.md },
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarImg: {
      width: 80, height: 80, borderRadius: 40,
      borderWidth: 3, borderColor: c.bgDeep,
    },
    avatarOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center', justifyContent: 'center',
    },
    avatarEditBadge: {
      position: 'absolute', bottom: 0, right: 0,
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: c.bgDeep,
      borderWidth: 2, borderColor: c.bg,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    avatarText: { color: '#ffffff', fontSize: 32, fontWeight: '800' },
    editFields: { width: '100%', gap: SPACING.sm, marginTop: SPACING.sm },
    editInput: {
      borderWidth: 1,
      borderRadius: RADII.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      fontSize: FONT_SIZES.md,
      textAlign: 'left',
    },
    name: {
      fontSize: FONT_SIZES.xl,
      fontWeight: '800', letterSpacing: -0.5,
    },
    jobTitle: { fontSize: FONT_SIZES.md, marginTop: SPACING.xs },
    location: { fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
    statsRow: {
      flexDirection: 'row',
      borderWidth: 1,
      borderRadius: RADII.lg, padding: SPACING.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0.2 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    statDivider: { width: 1 },
    section: { gap: SPACING.sm },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: c.textMuted, fontSize: FONT_SIZES.xs,
      fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1,
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
    sectionEmpty: {
      fontSize: FONT_SIZES.sm,
    },
    skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    skillChip: {
      borderWidth: 1,
      borderRadius: RADII.full,
      paddingHorizontal: SPACING.sm + 4, paddingVertical: SPACING.xs + 2,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: c.isDark ? 0 : 0.05,
      shadowRadius: 3,
      elevation: c.isDark ? 0 : 1,
    },
    skillText: { fontSize: FONT_SIZES.xs, fontWeight: '500' },
    settingsBtn: {
      borderWidth: 1,
      borderRadius: RADII.full,
      paddingVertical: SPACING.sm + 4,
      paddingHorizontal: SPACING.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.isDark ? 0.15 : 0.06,
      shadowRadius: 6,
      elevation: c.isDark ? 0 : 1,
    },
    settingsBtnText: { flex: 1, textAlign: 'center', fontSize: FONT_SIZES.sm, fontWeight: '600' },
    signOutBtn: {
      backgroundColor: 'rgba(255,59,48,0.07)', borderWidth: 1,
      borderColor: 'rgba(255,59,48,0.2)', borderRadius: RADII.full,
      paddingVertical: SPACING.sm + 4, alignItems: 'center',
    },
    signOutText: { color: '#ef4444', fontSize: FONT_SIZES.sm, fontWeight: '600' },
  });
}
