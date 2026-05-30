import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, JobAlert } from '@/services/api';
import { registerForPushNotifications } from '@/services/notifications';
import { BOTTOM_NAV_HEIGHT, FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
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

const WT_LABELS: Record<string, string> = {
  any: 'Farketmez', remote: 'Remote', hybrid: 'Hibrit', office: 'Ofis',
};
const SN_LABELS: Record<string, string> = {
  junior: 'Junior', mid: 'Mid-Level', senior: 'Senior', lead: 'Lead',
};

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
  if (a.location && a.location !== 'Istanbul, Turkey') parts.push(a.location);
  if (a.sectors?.length) parts.push(a.sectors.slice(0, 2).join(', '));
  return parts.join(' · ') || a.location || 'Istanbul, Turkey';
}

const DEFAULT_FORM = {
  keyword: '',
  location: 'Istanbul, Turkey',
  work_type: 'any',
  seniority: [] as string[],
};

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch {
      // auth hatası — ekranı sessizce boş bırak
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openModal() {
    setForm(DEFAULT_FORM);
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

  async function handleCreate() {
    const trimmed = form.keyword.trim();
    if (!trimmed) {
      Alert.alert('Eksik alan', 'Lütfen bir anahtar kelime gir.');
      return;
    }
    setCreating(true);
    try {
      const created = await api.createAlert({
        label: '',
        keyword: trimmed,
        location: form.location.trim() || 'Istanbul, Turkey',
        work_type: form.work_type,
        seniority: form.seniority,
        sectors: [],
      });
      setAlerts((prev) => [created, ...prev]);
      setShowModal(false);
      registerForPushNotifications();
    } catch {
      Alert.alert('Hata', 'Alarm oluşturulamadı. Lütfen tekrar dene.');
    } finally {
      setCreating(false);
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
          setAlerts((prev) => prev.filter((a) => a.id !== id));
          try {
            await api.deleteAlert(id);
          } catch {}
        },
      },
    ]);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>İlan Alarmları</Text>
            <Text style={styles.subtitle}>Her sabah 09:00'da yeni ilanlar için bildirim al</Text>
          </View>
          <TouchableOpacity onPress={openModal} style={styles.addBtn} activeOpacity={0.75}>
            <Text style={styles.addBtnText}>+ Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BOTTOM_NAV_HEIGHT + SPACING.lg }]}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alarmlarım</Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text} />
            </View>
          ) : alerts.length === 0 ? (
            <TouchableOpacity onPress={openModal} style={styles.emptyCard} activeOpacity={0.75}>
              <Text style={styles.emptyIcon}>🔔</Text>
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
                <View style={styles.alertLeft}>
                  <Text style={styles.alertLabel}>{alertLabel(alert)}</Text>
                  <Text style={styles.alertSub}>{alertSub(alert)}</Text>
                </View>
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
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Alert Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
        >
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + SPACING.md }]}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Alarm</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={12}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Keyword */}
              <Text style={styles.fieldLabel}>Anahtar Kelime *</Text>
              <TextInput
                style={styles.input}
                placeholder="örn. React Native, Product Manager"
                placeholderTextColor={colors.textDim}
                value={form.keyword}
                onChangeText={(v) => setForm((p) => ({ ...p, keyword: v }))}
                returnKeyType="next"
                autoCapitalize="none"
              />

              {/* Location */}
              <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Konum</Text>
              <TextInput
                style={styles.input}
                placeholder="İstanbul, Turkey"
                placeholderTextColor={colors.textDim}
                value={form.location}
                onChangeText={(v) => setForm((p) => ({ ...p, location: v }))}
                returnKeyType="done"
                autoCapitalize="words"
              />

              {/* Work type */}
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

              {/* Seniority */}
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

              {/* Submit */}
              <TouchableOpacity
                onPress={handleCreate}
                style={[styles.submitBtn, creating && { opacity: 0.6 }]}
                activeOpacity={0.8}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Alarm Kur 🔔</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },

    // Header
    header: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: c.cardBorder,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
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
    addBtn: {
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
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

    // Content
    content: { padding: SPACING.lg, gap: SPACING.lg },
    section: { gap: SPACING.sm },
    sectionTitle: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },

    // Alert cards
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
    deleteText: { color: c.textMuted, fontSize: 14 },

    // Loading / empty
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
    emptyIcon: { fontSize: 32 },
    emptyText: { color: c.text, fontSize: FONT_SIZES.md, fontWeight: '600' },
    emptySubText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      textAlign: 'center',
      maxWidth: 240,
    },
    emptyAddBtn: {
      marginTop: SPACING.sm,
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderRadius: RADII.full,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.isDark ? 0 : 0.22,
      shadowRadius: 8,
      elevation: c.isDark ? 0 : 3,
    },
    emptyAddBtnText: { color: '#fff', fontSize: FONT_SIZES.sm, fontWeight: '700' },

    // Modal
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
      maxHeight: '85%',
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
    modalClose: {
      color: c.textMuted,
      fontSize: 17,
      fontWeight: '600',
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
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderColor: c.isDark ? 'rgba(255,255,255,0.25)' : c.accent,
    },
    chipText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
    chipTextActive: {
      color: '#ffffff',
    },
    submitBtn: {
      marginTop: SPACING.xl,
      marginBottom: SPACING.sm,
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
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
