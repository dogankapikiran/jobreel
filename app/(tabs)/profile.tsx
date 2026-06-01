import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { useFeedStore } from '@/store/feedStore';
import { api, CvParsed } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { ACCENT_GRADIENT, BOTTOM_NAV_HEIGHT, FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { Seniority, WorkType } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

const SUGGESTED_SKILLS = [
  // Yazılım
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Node.js',
  'Python', 'Java', 'Swift', 'Kotlin', 'Go',
  'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS',
  // Tasarım & Ürün
  'Figma', 'UI/UX Design', 'Sketch', 'Prototyping',
  'Product Management', 'Agile', 'Scrum', 'Jira',
  // Veri & AI
  'Data Science', 'Machine Learning', 'SQL', 'Tableau', 'Power BI', 'Excel',
  // Pazarlama & İçerik
  'Digital Marketing', 'SEO', 'Google Analytics', 'Content Writing',
  'Social Media Marketing', 'HubSpot', 'Salesforce',
  // İK & Finans
  'Human Resources', 'Recruitment', 'Financial Modeling', 'Accounting',
  'Business Analysis', 'Project Management',
];

const SECTOR_SKILLS: Record<string, string[]> = {
  'Yazılım & Teknoloji': ['JavaScript', 'TypeScript', 'React', 'React Native', 'Node.js', 'Python', 'Java', 'Swift', 'Kotlin', 'Go', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS'],
  'Yapay Zeka & ML': ['Python', 'Machine Learning', 'Data Science', 'SQL', 'Tableau', 'Power BI', 'Docker', 'AWS'],
  'Veri & Analitik': ['SQL', 'Python', 'Data Science', 'Tableau', 'Power BI', 'Excel', 'Machine Learning', 'PostgreSQL'],
  'Fintech & Bankacılık': ['Financial Modeling', 'Accounting', 'SQL', 'Python', 'Business Analysis', 'Excel', 'PostgreSQL'],
  'E-ticaret': ['Digital Marketing', 'SEO', 'Google Analytics', 'Product Management', 'Agile', 'JavaScript', 'React'],
  'SaaS & B2B': ['Salesforce', 'HubSpot', 'Product Management', 'Agile', 'Business Analysis', 'JavaScript', 'React'],
  'Reklam & Pazarlama': ['Digital Marketing', 'SEO', 'Google Analytics', 'Content Writing', 'Social Media Marketing', 'HubSpot', 'Salesforce'],
  'İnsan Kaynakları & HR Tech': ['Human Resources', 'Recruitment', 'Project Management', 'Business Analysis', 'Excel'],
  'Muhasebe & Finans': ['Financial Modeling', 'Accounting', 'Excel', 'SQL', 'Power BI', 'Business Analysis'],
  'Eğitim & EdTech': ['Content Writing', 'Product Management', 'Agile', 'JavaScript', 'React', 'Python'],
  'Sağlık & Biyoteknoloji': ['Python', 'Data Science', 'SQL', 'Machine Learning', 'Business Analysis', 'Excel'],
  'Gaming & Oyun': ['JavaScript', 'TypeScript', 'Python', 'Java', 'Kotlin', 'Swift', 'Go', 'React', 'Node.js'],
};

function StatCard({ value, label, colors }: { value: string | number; label: string; colors: ThemeColors }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: SPACING.xs }}>
      <Text style={{ color: colors.text, fontSize: FONT_SIZES.xl, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: FONT_SIZES.xs }}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { profile, setProfile, setPreferences } = useUserStore();
  const { savedJobs, appliedJobs } = useFeedStore();

  const signOut = useAuthStore((s) => s.signOut);

  const avatarButtonRef = useRef<View>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cvParsed, setCvParsed] = useState<CvParsed | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [showSkillsEditor, setShowSkillsEditor] = useState(false);
  const [draftSkills, setDraftSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [skillsSaving, setSkillsSaving] = useState(false);

  const [draftName, setDraftName] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftLocation, setDraftLocation] = useState('');

  const skills = profile.skills ?? [];
  const prefs = profile.preferences ?? { sectors: [], seniority: [], workType: 'any' as WorkType, location: '', salaryMin: 0, skills: [] };

  const [profileLoadError, setProfileLoadError] = useState(false);

  useEffect(() => {
    setProfileLoadError(false);
    api.getProfile().then((data) => {
      if (data.display_name) setProfile({ name: data.display_name as string });
      if (data.title) setProfile({ title: data.title as string });
      if (data.avatar_url) setProfile({ avatarUrl: data.avatar_url as string });
      const prefs = data.preferences as Record<string, unknown> | undefined;
      if (prefs) {
        const rawWorkType = (prefs.work_type as string) || 'any';
        const parsedWorkTypes =
          rawWorkType !== 'any'
            ? (rawWorkType.split(',').map((s) => s.trim()).filter(Boolean) as WorkType[])
            : [];
        setPreferences({
          sectors: (prefs.sectors as string[]) || [],
          seniority: (prefs.seniority as Seniority[]) || [],
          workType: rawWorkType as WorkType,
          workTypes: parsedWorkTypes.length > 0 && parsedWorkTypes.length < 3 ? parsedWorkTypes : undefined,
          location: (prefs.location as string) || 'İstanbul',
          salaryMin: (prefs.salary_min as number) || 0,
          skills: (prefs.skills as string[]) || [],
        });
      }
      if (data.cv_parsed) setCvParsed(data.cv_parsed as CvParsed);
    }).catch(() => { setProfileLoadError(true); });
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

  async function handlePickAvatar() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    let ImagePicker: typeof import('expo-image-picker');
    try {
      const raw = require('expo-image-picker');
      ImagePicker = raw?.default ?? raw;
    } catch {
      Alert.alert('Hata', 'Profil fotoğrafı değiştirmek için App Store\'dan güncel versiyonu kullanın.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri iznine ihtiyaç var.');
      return;
    }

    const pickerOptions: Parameters<typeof ImagePicker.launchImageLibraryAsync>[0] = {
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };

    if (Platform.OS === 'ios' && Platform.isPad) {
      const rect = await new Promise<{ x: number; y: number; width: number; height: number }>(
        (resolve) => {
          avatarButtonRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
            resolve({ x: pageX, y: pageY, width: w, height: h });
          });
        }
      );
      (pickerOptions as any).presentationStyle =
        ImagePicker.UIImagePickerPresentationStyle.POPOVER;
      (pickerOptions as any).sourceRect = rect;
    }

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

  function openSkillsEditor() {
    setDraftSkills([...(profile.skills ?? [])]);
    setCustomSkillInput('');
    setShowSkillsEditor(true);
  }

  function toggleDraftSkill(s: string) {
    setDraftSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function addCustomDraftSkill() {
    const trimmed = customSkillInput.trim();
    if (trimmed && !draftSkills.includes(trimmed)) {
      setDraftSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkillInput('');
  }

  async function saveSkills() {
    setSkillsSaving(true);
    const newSkills = draftSkills;
    const prevSkills = profile.skills ?? [];
    const prevPrefSkills = prefs.skills ?? [];
    setProfile({ skills: newSkills });
    setPreferences({ skills: newSkills });
    api.updateProfile({
      skills: newSkills,
      preferences: {
        sectors: prefs.sectors,
        work_type: prefs.workType,
        seniority: prefs.seniority,
        location: prefs.location,
        salary_min: prefs.salaryMin,
        skills: newSkills,
      },
    }).then(() => {
      setShowSkillsEditor(false);
    }).catch(() => {
      setProfile({ skills: prevSkills });
      setPreferences({ skills: prevPrefSkills });
      Alert.alert('Bağlantı Hatası', 'Yetenekler kaydedilemedi. Tekrar deneyin.');
    }).finally(() => {
      setSkillsSaving(false);
    });
  }

  const suggestedSkills = useMemo(() => {
    const userSectors = prefs.sectors ?? [];
    if (userSectors.length === 0) return SUGGESTED_SKILLS;
    const sectorSkills = Array.from(new Set(userSectors.flatMap((s) => SECTOR_SKILLS[s] ?? [])));
    const prioritized = sectorSkills.filter((s) => SUGGESTED_SKILLS.includes(s));
    const rest = SUGGESTED_SKILLS.filter((s) => !prioritized.includes(s));
    return [...prioritized, ...rest];
  }, [prefs.sectors]);

  const completionItems = [
    { label: 'Ad Soyad', points: 20, done: !!profile.name },
    { label: 'Ünvan', points: 10, done: !!profile.title },
    { label: 'Yetenek (en az 3)', points: 25, done: skills.length >= 3 },
    { label: 'Sektör tercihleri', points: 20, done: (prefs.sectors ?? []).length > 0 },
    { label: 'Fotoğraf', points: 10, done: !!profile.avatarUrl },
    { label: 'CV Yükle', points: 10, done: !!cvParsed },
    { label: 'Konum', points: 5, done: !!prefs.location },
  ];
  const completionScore = completionItems.filter((i) => i.done).reduce((sum, i) => sum + i.points, 0);
  const missingItems = completionItems.filter((i) => !i.done);

  const displayName = profile.name || 'Anonim';
  const initial = displayName.charAt(0).toUpperCase();

  const WT_LABEL: Record<string, string> = { any: 'Farketmez', remote: 'Remote', hybrid: 'Hibrit', office: 'Ofis' };
  const workTypeDisplay = (() => {
    if (prefs.workType === 'any' || !prefs.workType) return 'Farketmez';
    if (prefs.workType.includes(',')) {
      return prefs.workType.split(',').map((v) => WT_LABEL[v.trim()] ?? v).join(', ');
    }
    return WT_LABEL[prefs.workType] ?? 'Belirtilmemiş';
  })();

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
          {profileLoadError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>Profil yüklenemedi. Önbellek verileri gösteriliyor.</Text>
            </View>
          )}
          {/* Avatar */}
          <View style={styles.hero}>
            <View ref={avatarButtonRef}>
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
            </View>

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
          {completionScore >= 100 ? (
            <View style={styles.completionComplete}>
              <Ionicons name="checkmark-circle" size={18} color="#2ecc71" />
              <Text style={styles.completionCompleteText}>Profil %100 tamamlandı</Text>
            </View>
          ) : (
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
              {missingItems.slice(0, 3).map((item) => (
                <Text key={item.label} style={styles.completionHint}>
                  {item.label} ekle → +{item.points} puan
                </Text>
              ))}
              {missingItems.length > 3 && (
                <Text style={styles.completionHint}>+{missingItems.length - 3} madde daha...</Text>
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
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Tercihler</Text>
              <TouchableOpacity
                onPress={() => router.push('/onboarding/preferences?edit=1')}
                activeOpacity={0.7}
                style={styles.sectionEditBtn}
              >
                <Text style={styles.sectionEditText}>Düzenle</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🏷️</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Sektörler</Text>
                  {(prefs.sectors ?? []).length > 0 ? (
                    <Text style={styles.infoValue}>{(prefs.sectors ?? []).join(', ')}</Text>
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
                  <Text style={styles.infoValue}>{workTypeDisplay}</Text>
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
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Yetenekler</Text>
              <TouchableOpacity onPress={openSkillsEditor} activeOpacity={0.7} style={styles.sectionEditBtn}>
                <Text style={styles.sectionEditText}>Düzenle</Text>
              </TouchableOpacity>
            </View>
            {skills.length > 0 ? (
              <View style={styles.skillsWrap}>
                {skills.map((skill) => (
                  <View key={skill} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.sectionEmpty}>Henüz yetenek eklenmedi.</Text>
            )}
          </View>

          {/* CV */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CV / Özgeçmiş</Text>
            {cvParsed ? (
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📄</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoValue}>{cvParsed.title || 'CV yüklendi'}</Text>
                    <Text style={styles.infoLabel}>
                      {cvParsed.skills?.length || 0} yetenek · {cvParsed.experience?.length || 0} deneyim
                    </Text>
                  </View>
                  {cvLoading ? (
                    <ActivityIndicator size="small" color={colors.textMuted} />
                  ) : (
                    <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                      <TouchableOpacity onPress={handleViewCv} hitSlop={8} activeOpacity={0.7}>
                        <Text style={styles.cvActionLink}>Görüntüle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handlePickCv} hitSlop={8} activeOpacity={0.7}>
                        <Text style={styles.cvActionLink}>Güncelle</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.cvUploadBtn}
                onPress={handlePickCv}
                activeOpacity={0.8}
                disabled={cvLoading}
                accessibilityRole="button"
                accessibilityLabel="CV yükle, PDF dosyası seç"
              >
                {cvLoading ? (
                  <ActivityIndicator color={colors.text} />
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

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/job-alerts')}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsBtnText}>İş İlanı Uyarısı</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsBtnText}>Ayarlar</Text>
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
        <Modal
          visible={showSkillsEditor}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSkillsEditor(false)}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowSkillsEditor(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.sheetKeyboard}
          >
            <View style={[styles.sheet, styles.skillsSheet, { paddingBottom: insets.bottom + SPACING.lg }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Yetenekler</Text>
                <TouchableOpacity onPress={() => setShowSkillsEditor(false)} style={styles.sheetCloseBtn}>
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.skillInputRow}>
                <TextInput
                  style={styles.skillInputField}
                  value={customSkillInput}
                  onChangeText={setCustomSkillInput}
                  placeholder="Yetenek ekle..."
                  placeholderTextColor={colors.textDim}
                  onSubmitEditing={addCustomDraftSkill}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.skillAddBtn} onPress={addCustomDraftSkill} activeOpacity={0.8}>
                  <Text style={styles.skillAddBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.skillChipsWrap}>
                  {suggestedSkills.map((s) => {
                    const active = draftSkills.includes(s);
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.skillEditorChip, active && styles.skillEditorChipActive]}
                        onPress={() => toggleDraftSkill(s)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.skillEditorChipText, active && styles.skillEditorChipTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {draftSkills
                    .filter((s) => !suggestedSkills.includes(s))
                    .map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.skillEditorChip, styles.skillEditorChipActive, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}
                        onPress={() => toggleDraftSkill(s)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.skillEditorChipText, styles.skillEditorChipTextActive]}>{s}</Text>
                        <Ionicons name="close" size={10} color={colors.isDark ? colors.text : '#ffffff'} />
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.skillsSaveBtn}
                onPress={saveSkills}
                activeOpacity={0.85}
                disabled={skillsSaving}
              >
                {skillsSaving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.skillsSaveBtnText}>Kaydet ({draftSkills.length} yetenek)</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

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
    avatarEditIcon: { fontSize: 15 },
    avatarText: { color: '#ffffff', fontSize: 32, fontWeight: '800' },
    editFields: { width: '100%', gap: SPACING.sm, marginTop: SPACING.sm },
    editInput: {
      backgroundColor: c.cardBg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      color: c.text,
      fontSize: FONT_SIZES.md,
      textAlign: 'left',
    },
    name: {
      color: c.text, fontSize: FONT_SIZES.xl,
      fontWeight: '800', letterSpacing: -0.5,
    },
    jobTitle: { color: c.textMuted, fontSize: FONT_SIZES.md, marginTop: SPACING.xs },
    location: { color: c.textMuted, fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
    statsRow: {
      flexDirection: 'row',
      backgroundColor: c.bgDeep,
      borderWidth: 1, borderColor: c.cardBorder,
      borderRadius: RADII.lg, padding: SPACING.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0.2 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    statDivider: { width: 1, backgroundColor: c.cardBorder },
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
      color: c.isDark ? c.textMuted : c.accent,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
    sectionEmpty: {
      color: c.textDim,
      fontSize: FONT_SIZES.sm,
    },
    card: {
      backgroundColor: c.bgDeep, borderWidth: 1,
      borderColor: c.cardBorder, borderRadius: RADII.lg, overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0.2 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    cardDivider: { height: 1, backgroundColor: c.cardBorder },
    infoRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: SPACING.sm + 4, padding: SPACING.md,
    },
    infoIcon: { fontSize: 18, width: 24, textAlign: 'center' },
    infoContent: { flex: 1 },
    infoLabel: { color: c.textMuted, fontSize: FONT_SIZES.xs, marginBottom: 2 },
    infoValue: { color: c.text, fontSize: FONT_SIZES.sm, fontWeight: '500' },
    skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    skillChip: {
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.full,
      paddingHorizontal: SPACING.sm + 4, paddingVertical: SPACING.xs + 2,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: c.isDark ? 0 : 0.05,
      shadowRadius: 3,
      elevation: c.isDark ? 0 : 1,
    },
    skillText: { color: c.text, fontSize: FONT_SIZES.xs, fontWeight: '500' },
    settingsBtn: {
      backgroundColor: c.bgDeep, borderWidth: 1,
      borderColor: c.cardBorder, borderRadius: RADII.full,
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
    settingsBtnText: { flex: 1, textAlign: 'center', color: c.text, fontSize: FONT_SIZES.sm, fontWeight: '600' },
    signOutBtn: {
      backgroundColor: 'rgba(255,59,48,0.07)', borderWidth: 1,
      borderColor: 'rgba(255,59,48,0.2)', borderRadius: RADII.full,
      paddingVertical: SPACING.sm + 4, alignItems: 'center',
    },
    signOutText: { color: '#ef4444', fontSize: FONT_SIZES.sm, fontWeight: '600' },
    errorBanner: {
      backgroundColor: 'rgba(239,68,68,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.2)',
      borderRadius: RADII.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    errorBannerText: {
      color: '#ef4444',
      fontSize: FONT_SIZES.xs,
      textAlign: 'center',
    },
    sheetBackdrop: {
      flex: 1,
      backgroundColor: c.isDark ? 'rgba(0,5,20,0.65)' : 'rgba(5,22,80,0.30)',
    },
    sheet: {
      backgroundColor: c.cardBg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.sm,
      maxHeight: '70%',
      borderTopWidth: 1,
      borderColor: c.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: c.isDark ? 0.4 : 0.08,
      shadowRadius: 20,
      elevation: 10,
    },
    sheetHandle: {
      width: 36, height: 4,
      backgroundColor: c.cardBorder,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: SPACING.md,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.md,
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: c.cardBorder,
    },
    sheetTitle: {
      color: c.text,
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
    },
    sheetCloseBtn: {
      width: 30, height: 30,
      backgroundColor: c.bgDeep,
      borderRadius: 15,
      alignItems: 'center', justifyContent: 'center',
    },
    cvUploadBtn: {
      backgroundColor: c.bgDeep,
      borderWidth: 1.5,
      borderColor: c.cardBorder,
      borderRadius: RADII.lg,
      borderStyle: 'dashed',
      padding: SPACING.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      justifyContent: 'center',
    },
    cvUploadIcon: { fontSize: 24 },
    cvUploadText: { color: c.text, fontSize: FONT_SIZES.md, fontWeight: '700' },
    cvUploadSub: { color: c.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
    cvActionLink: {
      color: c.isDark ? c.textMuted : c.accent,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
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
      color: c.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '800',
    },
    completionBar: {
      height: 6,
      backgroundColor: c.cardBorder,
      borderRadius: RADII.full,
      overflow: 'hidden',
    },
    completionFill: {
      height: '100%',
      borderRadius: RADII.full,
    },
    completionHint: {
      color: c.textMuted,
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
    sheetKeyboard: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
    },
    skillsSheet: {
      maxHeight: '80%',
    },
    skillInputRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    skillInputField: {
      flex: 1,
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      color: c.text,
      fontSize: FONT_SIZES.md,
    },
    skillAddBtn: {
      width: 48,
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skillAddBtnText: { color: '#ffffff', fontSize: 24, fontWeight: '300' },
    skillChipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      paddingBottom: SPACING.md,
    },
    skillEditorChip: {
      paddingHorizontal: SPACING.sm + 4,
      paddingVertical: SPACING.xs + 4,
      borderRadius: RADII.full,
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    skillEditorChipActive: {
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.18)' : c.accent,
      borderColor: c.isDark ? 'rgba(226,232,245,0.35)' : c.accent,
    },
    skillEditorChipText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.sm,
      fontWeight: '500',
    },
    skillEditorChipTextActive: { color: c.isDark ? c.text : '#ffffff' },
    skillsSaveBtn: {
      height: 52,
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.15)' : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: 'rgba(226,232,245,0.30)',
      borderRadius: RADII.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.sm,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: c.isDark ? 0 : 0.28,
      shadowRadius: 14,
      elevation: c.isDark ? 0 : 4,
    },
    skillsSaveBtnText: { color: '#ffffff', fontSize: FONT_SIZES.md, fontWeight: '700' },
  });
}
