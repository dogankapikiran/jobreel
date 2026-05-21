import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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

const NOTIF_KEY = 'notification_settings';

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
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

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
    }
    await saveNotif({ ...notif, pushEnabled: val });
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
                  try { await supabase.rpc('delete_user'); } catch {}
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

  async function handleEmailChange() {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailError('Geçerli bir e-posta adresi girin.');
      return;
    }
    setEmailLoading(true);
    setEmailError('');
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailLoading(false);
    if (error) {
      setEmailError(error.message);
    } else {
      setEmailModalVisible(false);
      setNewEmail('');
      Alert.alert('Başarılı', 'Yeni e-posta adresinize bir onay maili gönderildi.');
    }
  }

  const userEmail = session?.user?.email ?? '';

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
          <Divider colors={colors} />
          <ToggleRow
            icon="flash-outline"
            label="Yeni Eşleşme"
            value={notif.newMatch}
            onValueChange={(v) => saveNotif({ ...notif, newMatch: v })}
            disabled={!notif.pushEnabled}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            icon="alarm-outline"
            label="İş Uyarıları"
            value={notif.jobAlerts}
            onValueChange={(v) => saveNotif({ ...notif, jobAlerts: v })}
            disabled={!notif.pushEnabled}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            icon="moon-outline"
            label="Sessiz Saatler (DND)"
            value={notif.dndEnabled}
            onValueChange={(v) => saveNotif({ ...notif, dndEnabled: v })}
            disabled={!notif.pushEnabled}
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
          <ArrowRow
            icon="link-outline"
            label="Bağlı Hesaplar"
            sublabel="Apple, LinkedIn"
            onPress={() => router.push('/linkedin-connect')}
            colors={colors}
          />
          <Divider colors={colors} />
          <ArrowRow
            icon="mail-outline"
            label="E-posta Değiştir"
            sublabel={userEmail}
            onPress={() => { setNewEmail(''); setEmailError(''); setEmailModalVisible(true); }}
            colors={colors}
          />
          <Divider colors={colors} />
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
            onPress={() => router.push('/privacy')}
            colors={colors}
          />
          <Divider colors={colors} />
          <ArrowRow
            icon="reader-outline"
            label="Kullanım Koşulları"
            onPress={() => router.push('/terms')}
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

      {/* E-posta Değiştir Modal */}
      <Modal
        visible={emailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setEmailModalVisible(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + SPACING.md }]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>E-posta Değiştir</Text>
          {userEmail ? <Text style={s.sheetSub}>Mevcut: {userEmail}</Text> : null}
          <TextInput
            style={[s.emailInput, emailError ? s.emailInputError : null]}
            placeholder="Yeni e-posta adresi"
            placeholderTextColor={colors.textMuted}
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailError ? <Text style={s.errorText}>{emailError}</Text> : null}
          <TouchableOpacity style={[s.sheetBtn, s.sheetBtnSolid]} onPress={handleEmailChange} activeOpacity={0.8} disabled={emailLoading}>
            {emailLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.sheetBtnText}>Güncelle</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleRow({
  icon, label, value, onValueChange, disabled, colors,
}: {
  icon: string; label: string; value: boolean;
  onValueChange: (v: boolean) => void; disabled?: boolean; colors: ThemeColors;
}) {
  const s = makeStyles(colors);
  return (
    <View style={[s.row, disabled && s.rowDisabled]}>
      <Ionicons name={icon as any} size={20} color={disabled ? colors.textDim : colors.textMuted} style={s.rowIcon} />
      <Text style={[s.rowLabel, disabled && { color: colors.textDim }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.cardBorder, true: colors.accent }}
        thumbColor="#ffffff"
        ios_backgroundColor={colors.cardBorder}
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

function Divider({ colors }: { colors: ThemeColors }) {
  return <View style={{ height: 1, backgroundColor: colors.cardBorder, marginLeft: 44 }} />;
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
  timeBtnValue: { color: colors.accent, fontSize: FONT_SIZES.md, fontWeight: '600' },
  versionText: { color: colors.textMuted, fontSize: FONT_SIZES.sm },
  // Modal/Sheet
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,22,80,0.35)' },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#dde1ea',
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  sheetHandle: {
    width: 40, height: 4,
    backgroundColor: '#dde1ea',
    borderRadius: RADII.full,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  sheetTitle: { color: colors.text, fontSize: FONT_SIZES.xl, fontWeight: '700', marginBottom: SPACING.xs },
  sheetSub: { color: colors.textMuted, fontSize: FONT_SIZES.sm, marginBottom: SPACING.md },
  emailInput: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: RADII.md,
    padding: SPACING.md,
    color: colors.text,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.sm,
  },
  emailInputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: FONT_SIZES.xs, marginBottom: SPACING.sm },
  sheetBtn: { borderRadius: RADII.md, overflow: 'hidden', marginTop: SPACING.sm },
  sheetBtnSolid: {
    height: 52,
    backgroundColor: '#051650',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#051650',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  sheetBtnText: { color: '#fff', fontSize: FONT_SIZES.md, fontWeight: '700' },
});
