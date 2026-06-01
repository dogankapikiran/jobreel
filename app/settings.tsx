import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { api } from '@/services/api';

const NOTIF_KEY = 'notification_settings';

const THEME_OPTIONS = [
  { value: 'light',  label: 'Açık',     icon: 'sunny-outline' },
  { value: 'system', label: 'Otomatik', icon: 'phone-portrait-outline' },
  { value: 'dark',   label: 'Koyu',     icon: 'moon-outline' },
] as const;

interface NotifSettings {
  pushEnabled: boolean;
  newMatch: boolean;
  jobAlerts: boolean;
  dndEnabled: boolean;
  dndStart: string;
  dndEnd: string;
}

const DEFAULT_SETTINGS: NotifSettings = {
  pushEnabled: true,
  newMatch: true,
  jobAlerts: true,
  dndEnabled: false,
  dndStart: '22:00',
  dndEnd: '08:00',
};

function timeStringToDate(s: string): Date {
  const [h, m] = s.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function SettingsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const s = makeStyles(colors);

  const [notif, setNotif] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [showDndStart, setShowDndStart] = useState(false);
  const [showDndEnd, setShowDndEnd] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_KEY).then((raw) => {
      if (raw) {
        try { setNotif({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) }); } catch {}
      }
    });
  }, []);

  async function saveNotif(next: NotifSettings) {
    setNotif(next);
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(next));
  }

  async function togglePush(val: boolean) {
    if (val) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Bildirim İzni',
          "Bildirimleri etkinleştirmek için Ayarlar'dan izin vermeniz gerekiyor.",
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Ayarları Aç', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      await saveNotif({ ...notif, pushEnabled: true });
      api.updateNotifPrefs({ notif_follow: true, notif_job_alerts: true }).catch(() => {});
    } else {
      await saveNotif({ ...notif, pushEnabled: false, newMatch: false, jobAlerts: false, dndEnabled: false });
      api.updateNotifPrefs({ notif_follow: false, notif_job_alerts: false }).catch(() => {});
    }
  }

  async function toggleSubNotif(key: 'newMatch' | 'jobAlerts' | 'dndEnabled', val: boolean) {
    const next = { ...notif, [key]: val };
    if (!next.newMatch && !next.jobAlerts) {
      next.pushEnabled = false;
      next.dndEnabled = false;
    }
    await saveNotif(next);
    if (key === 'newMatch') api.updateNotifPrefs({ notif_follow: val }).catch(() => {});
    if (key === 'jobAlerts') api.updateNotifPrefs({ notif_job_alerts: val }).catch(() => {});
  }

  function handleSignOut() {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive',
        onPress: async () => { await signOut(); router.replace('/auth'); },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Hesabı Sil',
      'Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Devam Et', style: 'destructive',
          onPress: () => Alert.alert(
            'Emin misiniz?',
            'Hesabınızı silmek istediğinizi onaylayın.',
            [
              { text: 'Geri Dön', style: 'cancel' },
              {
                text: 'Hesabı Sil', style: 'destructive',
                onPress: async () => {
                  const { error: rpcError } = await supabase.rpc('delete_user');
                  if (rpcError) {
                    Alert.alert(
                      'Hata',
                      'Hesap silinemedi. Destek ekibimize yazarak hesabınızın silinmesini talep edebilir veya oturumu kapatabilirsiniz.',
                      [
                        {
                          text: 'Destek Yaz',
                          onPress: () => Linking.openURL('mailto:support@jobreel.app?subject=Hesap%20Silme%20Talebi'),
                        },
                        {
                          text: 'Oturumu Kapat',
                          onPress: async () => { await signOut(); router.replace('/auth'); },
                        },
                        { text: 'İptal', style: 'cancel' },
                      ],
                    );
                    return;
                  }
                  await signOut();
                  router.replace('/auth');
                },
              },
            ],
          ),
        },
      ],
    );
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ayarlar</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── GÖRÜNÜM ── */}
        <Text style={s.sectionLabel}>GÖRÜNÜM</Text>
        <View style={s.card}>
          <View style={s.themeSegment}>
            {THEME_OPTIONS.map((opt) => {
              const active = colors.colorScheme === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.themeOption, active && s.themeOptionActive]}
                  onPress={() => colors.setColorScheme(opt.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={18}
                    color={active ? (colors.isDark ? colors.text : '#ffffff') : colors.textMuted}
                  />
                  <Text style={[s.themeOptionLabel, active && s.themeOptionLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── BİLDİRİMLER ── */}
        <Text style={s.sectionLabel}>BİLDİRİMLER</Text>
        <View style={s.card}>
          <ToggleRow
            icon="notifications-outline"
            label="Push Bildirimleri"
            value={notif.pushEnabled}
            onValueChange={togglePush}
            colors={colors}
          />
          <Divider colors={colors} sub />
          <ToggleRow
            icon="business-outline"
            label="Takip Bildirimleri"
            value={notif.newMatch}
            onValueChange={(v) => toggleSubNotif('newMatch', v)}
            disabled={!notif.pushEnabled}
            sub
            colors={colors}
          />
          <Divider colors={colors} sub />
          <ToggleRow
            icon="alarm-outline"
            label="İş Uyarıları"
            value={notif.jobAlerts}
            onValueChange={(v) => toggleSubNotif('jobAlerts', v)}
            disabled={!notif.pushEnabled}
            sub
            colors={colors}
          />
          <Divider colors={colors} sub />
          <ToggleRow
            icon="moon-outline"
            label="Sessiz Saatler (DND)"
            sublabel="Push bildirimleri bu ayardan etkilenmez"
            value={notif.dndEnabled}
            onValueChange={(v) => toggleSubNotif('dndEnabled', v)}
            disabled={!notif.pushEnabled}
            sub
            colors={colors}
          />
          {notif.dndEnabled && notif.pushEnabled && (
            <View style={s.dndTimes}>
              <TouchableOpacity style={s.timeBtn} onPress={() => setShowDndStart(true)} activeOpacity={0.7}>
                <Text style={s.timeBtnLabel}>Başlangıç</Text>
                <Text style={s.timeBtnValue}>{notif.dndStart}</Text>
              </TouchableOpacity>
              <View style={s.timeSep} />
              <TouchableOpacity style={s.timeBtn} onPress={() => setShowDndEnd(true)} activeOpacity={0.7}>
                <Text style={s.timeBtnLabel}>Bitiş</Text>
                <Text style={s.timeBtnValue}>{notif.dndEnd}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── HESAP & GÜVENLİK ── */}
        <Text style={s.sectionLabel}>HESAP & GÜVENLİK</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={handleSignOut} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} style={s.rowIcon} />
            <Text style={[s.rowLabel, { color: colors.danger }]}>Çıkış Yap</Text>
          </TouchableOpacity>
          <Divider colors={colors} />
          <TouchableOpacity style={s.row} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} style={s.rowIcon} />
            <Text style={[s.rowLabel, { color: colors.danger }]}>Hesabı Sil</Text>
          </TouchableOpacity>
        </View>

        {/* ── HAKKINDA ── */}
        <Text style={s.sectionLabel}>HAKKINDA</Text>
        <View style={s.card}>
          <ArrowRow
            icon="document-text-outline"
            label="Gizlilik Politikası"
            onPress={() => Linking.openURL('https://jobreel.app/gizlilik')}
            colors={colors}
          />
          <Divider colors={colors} />
          <ArrowRow
            icon="reader-outline"
            label="Kullanım Koşulları"
            onPress={() => Linking.openURL('https://jobreel.app/sartlar')}
            colors={colors}
          />
          <Divider colors={colors} />
          <ArrowRow
            icon="chatbubble-outline"
            label="Destek & İletişim"
            onPress={() => Linking.openURL('https://jobreel.app/iletisim')}
            colors={colors}
          />
          <Divider colors={colors} />
          <View style={s.row}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} style={s.rowIcon} />
            <Text style={s.rowLabel}>Uygulama Versiyonu</Text>
            <Text style={s.versionText}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* DND Saati Seçiciler */}
      {showDndStart && (
        <DateTimePicker
          value={timeStringToDate(notif.dndStart)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowDndStart(false);
            if (date) saveNotif({ ...notif, dndStart: dateToTimeString(date) });
          }}
        />
      )}
      {showDndEnd && (
        <DateTimePicker
          value={timeStringToDate(notif.dndEnd)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowDndEnd(false);
            if (date) saveNotif({ ...notif, dndEnd: dateToTimeString(date) });
          }}
        />
      )}

    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleRow({
  icon, label, sublabel, value, onValueChange, disabled, sub, colors,
}: {
  icon: string; label: string; sublabel?: string; value: boolean;
  onValueChange: (v: boolean) => void; disabled?: boolean; sub?: boolean; colors: ThemeColors;
}) {
  const s = makeStyles(colors);
  return (
    <View style={[s.row, sub && s.subRow, disabled && s.rowDisabled]}>
      <Ionicons
        name={icon as any}
        size={18}
        color={
          disabled ? colors.textDim
          : sub && !value ? (colors.isDark ? 'rgba(200,216,240,0.35)' : colors.textMuted)
          : colors.textMuted
        }
        style={[s.rowIcon, sub && s.subRowIcon]}
      />
      <View style={{ flex: 1 }}>
        <Text style={[
          s.rowLabel,
          sub && s.subRowLabel,
          disabled
            ? { color: colors.textDim }
            : sub && !value
            ? { color: colors.isDark ? 'rgba(200,216,240,0.35)' : colors.textMuted }
            : {},
        ]}>{label}</Text>
        {sublabel ? <Text style={s.rowSublabel}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: colors.isDark ? 'rgba(255,255,255,0.28)' : colors.cardBorder,
          true:  colors.isDark ? 'rgba(130,170,240,0.85)' : colors.accent,
        }}
        thumbColor="#ffffff"
        ios_backgroundColor={colors.isDark ? 'rgba(255,255,255,0.14)' : colors.cardBorder}
      />
    </View>
  );
}

function ArrowRow({
  icon, label, sublabel, onPress, colors,
}: {
  icon: string; label: string; sublabel?: string; onPress: () => void; colors: ThemeColors;
}) {
  const s = makeStyles(colors);
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={20} color={colors.textMuted} style={s.rowIcon} />
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sublabel ? <Text style={s.rowSublabel} numberOfLines={1}>{sublabel}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
    </TouchableOpacity>
  );
}

function Divider({ colors, sub }: { colors: ThemeColors; sub?: boolean }) {
  return <View style={{ height: 1, backgroundColor: colors.cardBorder, marginLeft: sub ? 60 : 44 }} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: RADII.full,
    backgroundColor: colors.cardBg,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingTop: SPACING.lg },
  sectionLabel: {
    color: colors.textDim,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    minHeight: 52,
  },
  rowDisabled: { opacity: 0.4 },
  rowIcon: { marginRight: SPACING.sm + 4, width: 24, textAlign: 'center' },
  rowLabel: { flex: 1, color: colors.text, fontSize: FONT_SIZES.md, fontWeight: '500' },
  subRow: { paddingLeft: SPACING.md + 16 },
  subRowIcon: { width: 20 },
  subRowLabel: { fontSize: FONT_SIZES.sm, fontWeight: '400' },
  rowSublabel: { color: colors.textMuted, fontSize: FONT_SIZES.xs, marginTop: 1 },
  dndTimes: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    marginTop: 2,
    backgroundColor: colors.bg,
    borderRadius: RADII.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  timeBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center' },
  timeSep: { width: 1, backgroundColor: colors.cardBorder },
  timeBtnLabel: { color: colors.textMuted, fontSize: FONT_SIZES.xs, marginBottom: 2 },
  timeBtnValue: { color: colors.isDark ? colors.textMuted : colors.accent, fontSize: FONT_SIZES.md, fontWeight: '600' },
  versionText: { color: colors.textMuted, fontSize: FONT_SIZES.sm },
  themeSegment: {
    flexDirection: 'row',
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADII.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  themeOptionActive: {
    backgroundColor: colors.isDark ? '#1a2540' : colors.accent,
    borderColor: colors.isDark ? 'rgba(255,255,255,0.15)' : colors.accent,
  },
  themeOptionLabel: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  themeOptionLabelActive: {
    color: colors.isDark ? colors.text : '#ffffff',
  },
});
