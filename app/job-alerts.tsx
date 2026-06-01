import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { api, JobAlert } from '@/services/api';
import { registerForPushNotifications } from '@/services/notifications';
import { useUserStore } from '@/store/userStore';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const WT_OPTIONS = [
  { value: 'any',    label: 'Farketmez' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hibrit' },
  { value: 'office', label: 'Ofis' },
];

const SN_OPTIONS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid',    label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead',   label: 'Lead' },
];

const TOP_SECTORS = [
  'Yazılım & Teknoloji', 'Yapay Zeka & ML', 'Fintech & Bankacılık',
  'E-ticaret', 'SaaS & B2B', 'Reklam & Pazarlama',
  'Veri & Analitik', 'İnsan Kaynakları & HR Tech', 'Sağlık & Biyoteknoloji',
  'Eğitim & EdTech', 'Gaming & Oyun', 'Muhasebe & Finans',
];

const WT_LABELS: Record<string, string> = {
  any: 'Farketmez', remote: 'Remote', hybrid: 'Hibrit', office: 'Ofis',
};
const SN_LABELS: Record<string, string> = {
  junior: 'Junior', mid: 'Mid-Level', senior: 'Senior', lead: 'Lead',
};

const DEFAULT_FORM = {
  keyword: '',
  location: 'Istanbul, Turkey',
  work_type: 'any',
  seniority: [] as string[],
  sectors: [] as string[],
};

function normalizeLocationDisplay(loc: string): string {
  return (loc || 'İstanbul')
    .replace(', Turkey', '')
    .replace(', Türkiye', '')
    .replace(/^Istanbul$/, 'İstanbul')
    .replace(/^Izmir$/, 'İzmir')
    .trim();
}

function alertLabel(a: JobAlert): string {
  if (a.label) return a.label;
  const parts: string[] = [];
  if (a.keyword) parts.push(a.keyword);
  if (a.work_type && a.work_type !== 'any') parts.push(WT_LABELS[a.work_type] ?? a.work_type);
  if (a.seniority?.length) parts.push(a.seniority.map((s) => SN_LABELS[s] ?? s).join(', '));
  return parts.join(' · ') || 'Genel Arama';
}

function alertSub(a: JobAlert): string {
  const parts: string[] = [];
  const loc = normalizeLocationDisplay(a.location);
  if (loc) parts.push(loc);
  if (a.sectors?.length) parts.push(a.sectors.slice(0, 2).join(', '));
  return parts.join(' · ') || 'İstanbul';
}

export default function JobAlertsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { profile } = useUserStore();

  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);

  const sectorOptions = useMemo(() => {
    const userSectors = profile.preferences.sectors ?? [];
    if (userSectors.length > 0) {
      const rest = TOP_SECTORS.filter((s) => !userSectors.includes(s));
      return [...userSectors, ...rest].slice(0, 14);
    }
    return TOP_SECTORS;
  }, [profile.preferences.sectors]);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openModal() {
    if (alerts.length >= 20) {
      Alert.alert('Limit Doldu', 'En fazla 20 arama alarmı oluşturabilirsin.');
      return;
    }
    setForm({
      ...DEFAULT_FORM,
      location: normalizeLocationDisplay(profile.preferences.location || 'Istanbul, Turkey'),
    });
    setEditingAlert(null);
    setShowModal(true);
  }

  function openEdit(alert: JobAlert) {
    setForm({
      keyword: alert.keyword,
      location: normalizeLocationDisplay(alert.location),
      work_type: alert.work_type,
      seniority: alert.seniority ?? [],
      sectors: alert.sectors ?? [],
    });
    setEditingAlert(alert);
    setShowModal(true);
  }

  function toggleSeniority(val: string) {
    setForm((prev) => ({
      ...prev,
      seniority: prev.seniority.includes(val)
        ? prev.seniority.filter((s) => s !== val)
        : [...prev.seniority, val],
    }));
  }

  function toggleSector(val: string) {
    setForm((prev) => ({
      ...prev,
      sectors: prev.sectors.includes(val)
        ? prev.sectors.filter((s) => s !== val)
        : [...prev.sectors, val],
    }));
  }

  function normalizeLocationForSave(loc: string): string {
    const clean = (loc || '').trim();
    const map: Record<string, string> = {
      'İstanbul': 'Istanbul, Turkey', 'istanbul': 'Istanbul, Turkey',
      'Ankara': 'Ankara, Turkey', 'ankara': 'Ankara, Turkey',
      'İzmir': 'Izmir, Turkey', 'izmir': 'Izmir, Turkey',
      'Bursa': 'Bursa, Turkey', 'bursa': 'Bursa, Turkey',
      'Antalya': 'Antalya, Turkey', 'antalya': 'Antalya, Turkey',
      'Remote': 'Remote', 'remote': 'Remote', 'Uzaktan': 'Remote',
    };
    if (map[clean]) return map[clean];
    if (!clean) return 'Istanbul, Turkey';
    return clean.includes(', Turkey') || clean.toLowerCase() === 'remote' ? clean : `${clean}, Turkey`;
  }

  async function handleSubmit() {
    const trimmed = form.keyword.trim();
    if (!trimmed && form.sectors.length === 0) {
      Alert.alert('Eksik alan', 'Anahtar kelime gir veya en az bir sektör seç.');
      return;
    }
    setCreating(true);

    const payload = {
      label: '',
      keyword: trimmed,
      location: normalizeLocationForSave(form.location) || 'Istanbul, Turkey',
      work_type: form.work_type,
      seniority: form.seniority,
      sectors: form.sectors,
    };

    if (editingAlert) {
      try {
        await api.updateAlert(editingAlert.id, payload);
        setAlerts((prev) => prev.map((a) => a.id === editingAlert.id ? { ...a, ...payload } : a));
        setShowModal(false);
        setEditingAlert(null);
      } catch {
        Alert.alert('Hata', 'Alarm güncellenemedi. Lütfen tekrar dene.');
      } finally {
        setCreating(false);
      }
    } else {
      try {
        const created = await api.createAlert(payload);
        setAlerts((prev) => [created, ...prev]);
        setShowModal(false);
        registerForPushNotifications();
      } catch {
        Alert.alert('Hata', 'Alarm oluşturulamadı. Lütfen tekrar dene.');
      } finally {
        setCreating(false);
      }
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
    try {
      await api.toggleAlert(id, enabled);
    } catch {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !enabled } : a)));
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Alarmı Sil', 'Bu arama alarmını silmek istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const deletedAlert = alerts.find((a) => a.id === id);
          setAlerts((prev) => prev.filter((a) => a.id !== id));
          try {
            await api.deleteAlert(id);
          } catch {
            if (deletedAlert) setAlerts((prev) => [deletedAlert, ...prev]);
            Alert.alert('Hata', 'Alarm silinemedi. Lütfen tekrar dene.');
          }
        },
      },
    ]);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>İş İlanı Uyarısı</Text>
          <Text style={styles.subtitle}>Yeni ilanlar çıktığında bildirim al</Text>
        </View>
        <View style={styles.headerRight}>
          {!loading && alerts.length > 0 && (
            <Text style={styles.alertCountText}>{alerts.length}/20</Text>
          )}
          <TouchableOpacity
            onPress={openModal}
            style={[styles.addBtn, alerts.length >= 20 && { opacity: 0.4 }]}
            activeOpacity={0.75}
            disabled={alerts.length >= 20}
            accessibilityRole="button"
            accessibilityLabel="Yeni alarm ekle"
          >
            <Text style={styles.addBtnText}>+ Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        <View style={styles.section}>
          {!loading && !loadError && alerts.length > 0 && (
            <Text style={styles.sectionTitle}>Alarmlarım</Text>
          )}

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text} />
            </View>
          ) : loadError ? (
            <View style={styles.emptyCard}>
              <Ionicons name="wifi-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>Bağlantı hatası</Text>
              <Text style={styles.emptySubText}>
                İnternet bağlantınızı kontrol edip tekrar deneyin.
              </Text>
              <TouchableOpacity onPress={load} style={styles.emptyAddBtn} activeOpacity={0.75}>
                <Text style={styles.emptyAddBtnText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          ) : alerts.length === 0 ? (
            <TouchableOpacity onPress={openModal} style={styles.emptyCard} activeOpacity={0.75}>
              <Ionicons name="notifications-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>Henüz alarm yok</Text>
              <Text style={styles.emptySubText}>
                Dokunarak yeni bir arama alarmı oluştur
              </Text>
              <View style={styles.emptyAddBtn}>
                <Text style={styles.emptyAddBtnText}>+ Alarm Ekle</Text>
              </View>
            </TouchableOpacity>
          ) : (
            alerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <TouchableOpacity
                  style={styles.alertLeft}
                  onPress={() => openEdit(alert)}
                  activeOpacity={0.7}
                >
                  <View style={styles.alertLabelRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertLabel}>{alertLabel(alert)}</Text>
                      <Text style={styles.alertSub}>{alertSub(alert)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
                <View style={styles.alertActions}>
                  <Switch
                    value={alert.enabled}
                    onValueChange={(v) => handleToggle(alert.id, v)}
                    trackColor={{
                      false: colors.cardBorder,
                      true: colors.isDark ? 'rgba(226,232,245,0.25)' : 'rgba(5,22,80,0.4)',
                    }}
                    thumbColor={alert.enabled
                      ? (colors.isDark ? colors.text : colors.accent)
                      : colors.textMuted
                    }
                    ios_backgroundColor={colors.cardBorder}
                  />
                  <TouchableOpacity
                    onPress={() => handleDelete(alert.id)}
                    style={styles.deleteBtn}
                    activeOpacity={0.7}
                    hitSlop={8}
                  >
                    <Ionicons name="close-outline" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => { Keyboard.dismiss(); setShowModal(false); }}
      >
        <Pressable style={styles.modalOverlay} onPress={() => { Keyboard.dismiss(); setShowModal(false); }} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
        >
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + SPACING.md }]}>
            <View style={styles.handle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAlert ? 'Alarmı Düzenle' : 'Yeni Alarm'}
              </Text>
              <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowModal(false); }} hitSlop={12}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 80 }}>
              <Text style={styles.fieldLabel}>Anahtar Kelime</Text>
              <TextInput
                style={styles.input}
                placeholder="örn. React Native, Product Manager"
                placeholderTextColor={colors.textDim}
                value={form.keyword}
                onChangeText={(v) => setForm((p) => ({ ...p, keyword: v }))}
                returnKeyType="next"
                autoCapitalize="none"
              />

              <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Konum</Text>
              <TextInput
                style={styles.input}
                placeholder="İstanbul, Ankara, Remote..."
                placeholderTextColor={colors.textDim}
                value={form.location}
                onChangeText={(v) => setForm((p) => ({ ...p, location: v }))}
                returnKeyType="done"
                autoCapitalize="words"
              />

              <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Çalışma Şekli</Text>
              <View style={styles.chipRow}>
                {WT_OPTIONS.map((opt) => {
                  const active = form.work_type === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setForm((p) => ({ ...p, work_type: opt.value }))}
                      style={[styles.chip, active && styles.chipActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Seviye</Text>
              <View style={styles.chipRow}>
                {SN_OPTIONS.map((opt) => {
                  const active = form.seniority.includes(opt.value);
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => toggleSeniority(opt.value)}
                      style={[styles.chip, active && styles.chipActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Sektör</Text>
              <View style={[styles.chipRow, { paddingBottom: SPACING.lg }]}>
                {sectorOptions.map((s) => {
                  const active = form.sectors.includes(s);
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => toggleSector(s)}
                      style={[styles.chip, active && styles.chipActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitBtn, creating && { opacity: 0.6 }]}
              activeOpacity={0.8}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {editingAlert ? 'Kaydet' : 'Alarm Kur'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },

    header: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: c.cardBorder,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    headerCenter: { flex: 1 },
    title: {
      color: c.text,
      fontSize: FONT_SIZES.xl,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      marginTop: 2,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    alertCountText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
    addBtn: {
      backgroundColor: c.isDark ? '#1a2540' : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: 'rgba(226,232,245,0.2)',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADII.full,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.isDark ? 0 : 0.22,
      shadowRadius: 8,
      elevation: c.isDark ? 0 : 3,
    },
    addBtnText: {
      color: '#fff',
      fontSize: FONT_SIZES.xs,
      fontWeight: '700',
    },

    content: { padding: SPACING.lg, gap: SPACING.lg },
    section: { gap: SPACING.sm },
    sectionTitle: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },

    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.lg,
      padding: SPACING.md,
      gap: SPACING.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0.2 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    alertLeft: { flex: 1 },
    alertLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    alertLabel: {
      color: c.text,
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
    },
    alertSub: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      marginTop: 2,
    },
    alertActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    deleteBtn: { padding: 4 },

    center: { alignItems: 'center', paddingVertical: SPACING.xl },
    emptyCard: {
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.lg,
      padding: SPACING.xl,
      alignItems: 'center',
      gap: SPACING.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0.2 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    emptyText: { color: c.text, fontSize: FONT_SIZES.md, fontWeight: '600' },
    emptySubText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      textAlign: 'center',
      maxWidth: 240,
    },
    emptyAddBtn: {
      marginTop: SPACING.sm,
      backgroundColor: c.isDark ? '#1a2540' : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: 'rgba(226,232,245,0.2)',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderRadius: RADII.full,
    },
    emptyAddBtnText: { color: '#fff', fontSize: FONT_SIZES.sm, fontWeight: '700' },

    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.isDark ? 'rgba(0,5,20,0.65)' : 'rgba(5,22,80,0.35)',
    },
    modalWrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    modalSheet: {
      backgroundColor: c.cardBg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.sm,
      maxHeight: '90%',
      borderTopWidth: 1,
      borderColor: c.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: c.isDark ? 0.4 : 0.08,
      shadowRadius: 20,
      elevation: 10,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.cardBorder,
      alignSelf: 'center',
      marginBottom: SPACING.md,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.lg,
    },
    modalTitle: {
      color: c.text,
      fontSize: FONT_SIZES.lg,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    fieldLabel: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: SPACING.xs,
    },
    input: {
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      color: c.text,
      fontSize: FONT_SIZES.sm,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.xs,
    },
    chip: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADII.full,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.bgDeep,
    },
    chipActive: {
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.18)' : c.accent,
      borderColor: c.isDark ? 'rgba(226,232,245,0.35)' : c.accent,
    },
    chipText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
    chipTextActive: {
      color: c.isDark ? c.text : '#ffffff',
    },
    submitBtn: {
      marginTop: SPACING.xl,
      marginBottom: SPACING.sm,
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.15)' : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: 'rgba(226,232,245,0.30)',
      borderRadius: RADII.lg,
      paddingVertical: SPACING.md,
      alignItems: 'center',
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: c.isDark ? 0 : 0.28,
      shadowRadius: 14,
      elevation: c.isDark ? 0 : 4,
    },
    submitText: {
      color: '#fff',
      fontSize: FONT_SIZES.md,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
  });
}
