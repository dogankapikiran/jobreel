import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const SECTORS = [
  'Yazılım & Teknoloji',
  'E-ticaret',
  'Fintech & Bankacılık',
  'Gaming & Oyun',
  'SaaS & B2B',
  'Yapay Zeka & ML',
  'Siber Güvenlik',
  'Blockchain & Web3',
  'Bulut Bilişim & DevOps',
  'Veri & Analitik',
  'Mobil Uygulama',
  'Lojistik & Tedarik Zinciri',
  'Sağlık & Biyoteknoloji',
  'Eğitim & EdTech',
  'Medya & İçerik',
  'Reklam & Pazarlama',
  'Üretim & Sanayi',
  'Otomotiv',
  'Havacılık & Uzay',
  'Enerji & Yenilenebilir Enerji',
  'İnşaat & Gayrimenkul',
  'Tarım & Gıda',
  'Perakende',
  'Turizm & Otelcilik',
  'Ulaşım & Mobilite',
  'Hukuk & Danışmanlık',
  'Muhasebe & Finans',
  'İnsan Kaynakları & HR Tech',
  'Kamu & Devlet',
  'Savunma & Güvenlik',
  'Sigorta',
  'Telekomünikasyon',
  'Çevre & Sürdürülebilirlik',
  'Sosyal Girişim & NGO',
  'Araştırma & Geliştirme',
];

const CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya',
  'Ankara', 'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir',
  'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis',
  'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari',
  'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 'İzmir', 'Kahramanmaraş',
  'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis',
  'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya',
  'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya',
  'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van',
  'Yalova', 'Yozgat', 'Zonguldak',
];

const WORK_TYPES: { value: WorkType; label: string; icon: string }[] = [
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

const ALL_SENIORITIES: Seniority[] = ['junior', 'mid', 'senior', 'lead'];
const ALL_WORK_TYPES: WorkType[] = ['remote', 'hybrid', 'office'];

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { profile, setPreferences } = useUserStore();
  const prefs = profile.preferences;
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = edit === '1';

  const [sectors, setSectors] = useState<string[]>(prefs.sectors);
  const [workTypes, setWorkTypes] = useState<WorkType[]>(() => {
    if (prefs.workTypes?.length && prefs.workTypes.length < WORK_TYPES.length) {
      return prefs.workTypes;
    }
    if (prefs.workType && prefs.workType !== 'any') {
      const parts = prefs.workType.split(',').map((s) => s.trim()).filter(Boolean) as WorkType[];
      if (parts.length > 0 && parts.length < ALL_WORK_TYPES.length) return parts;
    }
    return ALL_WORK_TYPES;
  });
  const [seniority, setSeniority] = useState<Seniority[]>(
    Array.isArray(prefs.seniority) && prefs.seniority.length > 0
      ? prefs.seniority
      : ALL_SENIORITIES
  );
  const [cities, setCities] = useState<string[]>(prefs.cities ?? []);
  const [saving, setSaving] = useState(false);

  const [sectorModalVisible, setSectorModalVisible] = useState(false);
  const [sectorSearch, setSectorSearch] = useState('');
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  function toggleSector(s: string) {
    setSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function toggleWorkType(wt: WorkType) {
    setWorkTypes((prev) =>
      prev.includes(wt) ? prev.filter((x) => x !== wt) : [...prev, wt]
    );
  }

  function toggleSeniority(s: Seniority) {
    setSeniority((prev) => {
      if (prev.includes(s)) {
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== s);
      }
      return [...prev, s];
    });
  }

  function toggleCity(c: string) {
    setCities((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  const filteredSectors = useMemo(() => {
    const q = sectorSearch.toLowerCase();
    const matched = SECTORS.filter((s) => s.toLowerCase().includes(q));
    return [...matched.filter((s) => sectors.includes(s)), ...matched.filter((s) => !sectors.includes(s))];
  }, [sectorSearch, sectors]);

  const filteredCities = useMemo(() => {
    const q = citySearch.toLowerCase();
    const matched = CITIES.filter((c) => c.toLowerCase().includes(q));
    return [...matched.filter((c) => cities.includes(c)), ...matched.filter((c) => !cities.includes(c))];
  }, [citySearch, cities]);

  function normalizeCityForApi(city: string): string {
    const map: Record<string, string> = {
      'İstanbul': 'Istanbul, Turkey', 'Ankara': 'Ankara, Turkey',
      'İzmir': 'Izmir, Turkey', 'Bursa': 'Bursa, Turkey',
      'Antalya': 'Antalya, Turkey', 'Adana': 'Adana, Turkey',
      'Konya': 'Konya, Turkey', 'Gaziantep': 'Gaziantep, Turkey',
      'Kayseri': 'Kayseri, Turkey', 'Mersin': 'Mersin, Turkey',
      'Kocaeli': 'Kocaeli, Turkey', 'Samsun': 'Samsun, Turkey',
      'Trabzon': 'Trabzon, Turkey', 'Eskişehir': 'Eskişehir, Turkey',
      'Diyarbakır': 'Diyarbakır, Turkey', 'Edirne': 'Edirne, Turkey',
      'Tekirdağ': 'Tekirdağ, Turkey', 'Sakarya': 'Sakarya, Turkey',
      'Manisa': 'Manisa, Turkey', 'Denizli': 'Denizli, Turkey',
    };
    return map[city] ?? (city ? `${city}, Turkey` : 'Istanbul, Turkey');
  }

  async function handleContinue() {
    const effectiveWorkType = (
      workTypes.length === 0 || workTypes.length === ALL_WORK_TYPES.length
        ? 'any'
        : workTypes.join(',')
    ) as WorkType | 'any';
    // Sadece ilk şehri API'ye uygun formatta sakla — birden fazla şehir join edilince feed bozuluyor
    const locationStr = cities.length === 0 ? '' : normalizeCityForApi(cities[0]);

    setPreferences({
      sectors,
      workType: effectiveWorkType,
      workTypes,
      seniority,
      location: locationStr,
      cities,
    });

    if (isEditMode) {
      setSaving(true);
      api.updateProfile({
        preferences: {
          sectors,
          work_type: effectiveWorkType,
          seniority,
          location: locationStr,
          cities,
          salary_min: prefs.salaryMin,
          skills: prefs.skills,
        },
      }).then(() => {
        router.back();
      }).catch(() => {
        Alert.alert('Hata', 'Tercihler kaydedilemedi. Lütfen tekrar dene.');
      }).finally(() => setSaving(false));
    } else {
      router.push('/onboarding/cv-upload');
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
              <View style={[styles.progressBar, { width: '33%' }]} />
            </View>
            <Text style={styles.step}>1/3</Text>
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
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setSectorModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={sectors.length === 0 ? styles.dropdownPlaceholder : styles.dropdownValue} numberOfLines={1}>
              {sectors.length === 0
                ? 'Farketmez (hepsi)'
                : sectors.length === 1
                  ? sectors[0]
                  : `${sectors[0]} +${sectors.length - 1} daha`}
            </Text>
            <Text style={styles.dropdownArrow}>▾</Text>
          </TouchableOpacity>
          {sectors.length > 0 && (
            <View style={styles.chips}>
              {sectors.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.chipActive}
                  onPress={() => toggleSector(s)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipTextActive}>{s} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Sektör Modal */}
        <Modal
          visible={sectorModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setSectorModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sektör Seç</Text>
                <TouchableOpacity onPress={() => { setSectorModalVisible(false); setSectorSearch(''); }}>
                  <Text style={styles.modalClose}>Tamam</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.modalSearch}
                value={sectorSearch}
                onChangeText={setSectorSearch}
                placeholder="Ara..."
                placeholderTextColor={colors.textDim}
                clearButtonMode="while-editing"
              />
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {filteredSectors.map((s) => {
                  const active = sectors.includes(s);
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.modalRow, active && styles.modalRowActive]}
                      onPress={() => toggleSector(s)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalRowText, active && styles.modalRowTextActive]}>{s}</Text>
                      <View style={[styles.checkbox, active && styles.checkboxActive]}>
                        {active && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Çalışma tipi */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Çalışma Tipi</Text>
          <View style={styles.optionGrid}>
            {WORK_TYPES.map((wt) => {
              const active = workTypes.includes(wt.value);
              return (
                <TouchableOpacity
                  key={wt.value}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => toggleWorkType(wt.value)}
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
          {workTypes.length === 3 && (
            <Text style={styles.workTypeHint}>= Farketmez olarak kaydedilir</Text>
          )}
        </View>

        {/* Kıdem */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Kıdem Seviyesi</Text>
          <View style={styles.seniorityList}>
            {SENIORITY_OPTIONS.map((opt) => {
              const active = seniority.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.seniorityRow, active && styles.seniorityActive]}
                  onPress={() => toggleSeniority(opt.value)}
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
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setCityModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={cities.length === 0 ? styles.dropdownPlaceholder : styles.dropdownValue} numberOfLines={1}>
              {cities.length === 0
                ? 'Farketmez (tüm şehirler)'
                : cities.length === 1
                  ? cities[0]
                  : `${cities[0]} +${cities.length - 1} daha`}
            </Text>
            <Text style={styles.dropdownArrow}>▾</Text>
          </TouchableOpacity>
          {cities.length > 0 && (
            <View style={styles.chips}>
              {cities.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={styles.chipActive}
                  onPress={() => toggleCity(c)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipTextActive}>{c} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {cities.length > 1 && (
            <Text style={styles.workTypeHint}>Feed {cities[0]} için filtrelenir (ilk şehir öncelikli)</Text>
          )}
        </View>

        {/* Şehir Modal */}
        <Modal
          visible={cityModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setCityModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Şehir Seç</Text>
                <TouchableOpacity onPress={() => { setCityModalVisible(false); setCitySearch(''); }}>
                  <Text style={styles.modalClose}>Tamam</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.modalSearch}
                value={citySearch}
                onChangeText={setCitySearch}
                placeholder="Şehir ara..."
                placeholderTextColor={colors.textDim}
                clearButtonMode="while-editing"
              />
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {filteredCities.map((c) => {
                  const active = cities.includes(c);
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.modalRow, active && styles.modalRowActive]}
                      onPress={() => toggleCity(c)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalRowText, active && styles.modalRowTextActive]}>{c}</Text>
                      <View style={[styles.checkbox, active && styles.checkboxActive]}>
                        {active && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
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

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
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
    editTitle: {
      flex: 1,
      color: c.text,
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
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
    section: {
      gap: SPACING.sm + 4,
    },
    sectionLabel: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    dropdownBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
    },
    dropdownPlaceholder: {
      color: c.textDim,
      fontSize: FONT_SIZES.md,
      flex: 1,
    },
    dropdownValue: {
      color: c.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      flex: 1,
    },
    dropdownArrow: {
      color: c.textMuted,
      fontSize: 18,
      marginLeft: SPACING.sm,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      marginTop: 4,
    },
    chipActive: {
      paddingHorizontal: SPACING.sm + 4,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADII.full,
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: 1,
      borderColor: c.isDark ? 'rgba(255,255,255,0.25)' : c.accent,
    },
    chipTextActive: {
      color: '#ffffff',
      fontSize: FONT_SIZES.sm,
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: c.cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: 32,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: c.cardBorder,
    },
    modalTitle: {
      color: c.text,
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
    },
    modalClose: {
      color: c.isDark ? '#aaa' : c.accent,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
    },
    modalSearch: {
      margin: SPACING.md,
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      color: c.text,
      fontSize: FONT_SIZES.md,
    },
    modalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: c.cardBorder,
    },
    modalRowActive: {
      backgroundColor: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(5,22,80,0.05)',
    },
    modalRowText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.md,
      flex: 1,
    },
    modalRowTextActive: {
      color: c.text,
      fontWeight: '600',
    },
    optionGrid: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    option: {
      flex: 1,
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      padding: SPACING.sm + 4,
      alignItems: 'center',
      gap: SPACING.xs,
    },
    optionActive: {
      backgroundColor: c.isDark ? c.cardBg : 'rgba(5,22,80,0.08)',
      borderColor: c.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(5,22,80,0.3)',
    },
    optionIcon: {
      fontSize: 20,
    },
    optionLabel: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '500',
      textAlign: 'center',
    },
    optionLabelActive: {
      color: c.text,
      fontWeight: '700',
    },
    workTypeHint: {
      color: c.textDim,
      fontSize: FONT_SIZES.xs,
      marginTop: 4,
    },
    seniorityList: {
      gap: SPACING.sm,
    },
    seniorityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      padding: SPACING.md,
      justifyContent: 'space-between',
    },
    seniorityActive: {
      backgroundColor: c.isDark ? c.cardBg : 'rgba(5,22,80,0.06)',
      borderColor: c.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(5,22,80,0.25)',
    },
    seniorityInfo: {
      gap: 2,
    },
    seniorityLabel: {
      color: c.textMuted,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
    },
    seniorityLabelActive: {
      color: c.text,
    },
    seniorityDesc: {
      color: c.isDark ? c.textDim : '#aab0bd',
      fontSize: FONT_SIZES.xs,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxActive: {
      borderColor: c.isDark ? c.textMuted : c.accent,
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
    },
    checkmark: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },
    footer: {
      padding: SPACING.lg,
      paddingTop: SPACING.sm,
    },
    ctaBtn: {
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
  });
}
