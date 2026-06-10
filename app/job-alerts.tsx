import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
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

// ─── Extracted subcomponents & constants ──────────────────────────────────────
import AlertCard from '@/components/alert/AlertCard';
import AlertModal from '@/components/alert/AlertModal';
import {
  DEFAULT_FORM,
  TOP_SECTORS,
  normalizeLocationForSave,
} from '@/constants/alertOptions';

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

  useEffect(() => {
    load();
  }, [load]);

  function openModal() {
    if (alerts.length >= 20) {
      Alert.alert('Limit Doldu', 'En fazla 20 arama alarmı oluşturabilirsin.');
      return;
    }
    setEditingAlert(null);
    setShowModal(true);
  }

  function openEdit(alert: JobAlert) {
    setEditingAlert(alert);
    setShowModal(true);
  }

  async function handleSubmitForm(form: typeof DEFAULT_FORM) {
    const trimmed = form.keyword.trim();
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
        setAlerts((prev) =>
          prev.map((a) => (a.id === editingAlert.id ? { ...a, ...payload } : a))
        );
        setShowModal(false);
        setEditingAlert(null);
      } catch {
        Alert.alert('Hata', 'Alarm güncellenemedi. Lütfen tekrar dene.');
      }
    } else {
      try {
        const created = await api.createAlert(payload);
        setAlerts((prev) => [created, ...prev]);
        setShowModal(false);
        registerForPushNotifications();
      } catch {
        Alert.alert('Hata', 'Alarm oluşturulamadı. Lütfen tekrar dene.');
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
              <Text style={styles.emptySubText}>Dokunarak yeni bir arama alarmı oluştur</Text>
              <View style={styles.emptyAddBtn}>
                <Text style={styles.emptyAddBtnText}>+ Alarm Ekle</Text>
              </View>
            </TouchableOpacity>
          ) : (
            alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onEdit={() => openEdit(alert)}
                onToggle={(v) => handleToggle(alert.id, v)}
                onDelete={() => handleDelete(alert.id)}
                colors={colors}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AlertModal
        visible={showModal}
        onClose={() => {
          Keyboard.dismiss();
          setShowModal(false);
        }}
        editingAlert={editingAlert}
        onSubmit={handleSubmitForm}
        sectorOptions={sectorOptions}
        defaultLocation={profile.preferences.location || 'Istanbul, Turkey'}
        colors={colors}
        insets={insets}
      />
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
  });
}
