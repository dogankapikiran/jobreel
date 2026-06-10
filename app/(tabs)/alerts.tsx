import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCompanyStore } from '@/store/companyStore';
import { api } from '@/services/api';
import { BOTTOM_NAV_HEIGHT, FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import AuthGate from '@/components/AuthGate';

export default function FollowingScreen() {
  const session = useAuthStore((s) => s.session);
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { following, follow, unfollow } = useCompanyStore();

  if (!session) {
    return (
      <AuthGate
        icon="business-outline"
        title="Takip Ettiklerim"
        description="Şirketleri takip ederek yeni iş ilanlarından anında haberdar olmak için giriş yapın."
      />
    );
  }

  const handleUnfollow = useCallback((company: string) => {
    Alert.alert(
      'Takibi Bırak',
      `${company} şirketini takipten çıkmak istiyor musun?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Takibi Bırak',
          style: 'destructive',
          onPress: () => {
            unfollow(company);
            api.unfollowCompany(company).catch(() => {
              follow(company);
              Alert.alert('Hata', 'Takip bırakılamadı. Lütfen tekrar dene.');
            });
          },
        },
      ]
    );
  }, [unfollow, follow]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Takip Ettiklerim</Text>
        <Text style={styles.subtitle}>Takip ettiğin şirketlerin ilanları</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BOTTOM_NAV_HEIGHT + SPACING.lg }]}
      >
        {following.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="business-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>Henüz takip ettiğin şirket yok</Text>
            <Text style={styles.emptySubText}>
              İş kartlarındaki zil ikonuyla şirketleri takip edebilirsin
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {following.map((company, index) => (
              <React.Fragment key={company}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.row}>
                  <View style={styles.initial}>
                    <Text style={styles.initialText}>{company.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.companyName}>{company}</Text>
                  <TouchableOpacity
                    onPress={() => handleUnfollow(company)}
                    style={styles.unfollowBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.unfollowText}>Bırak</Text>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
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
    content: {
      padding: SPACING.lg,
    },
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
    emptyText: {
      color: c.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
    },
    emptySubText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      textAlign: 'center',
      maxWidth: 240,
    },
    list: {
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.lg,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0.2 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    divider: {
      height: 1,
      backgroundColor: c.cardBorder,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm + 2,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
    },
    initial: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.07)' : 'rgba(5,22,80,0.07)',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    initialText: {
      fontSize: FONT_SIZES.md,
      fontWeight: '800',
      color: c.text,
    },
    companyName: {
      flex: 1,
      color: c.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
    },
    unfollowBtn: {
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADII.full,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.bg,
    },
    unfollowText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
  });
}
