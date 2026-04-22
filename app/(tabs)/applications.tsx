import React from 'react';
import { FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeedStore } from '@/store/feedStore';
import { timeAgo } from '@/services/adzuna';
import { COLORS, FONT_SIZES, GRADIENTS, RADII, SPACING } from '@/constants/theme';

export default function ApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const { jobs, appliedJobIds } = useFeedStore();

  const appliedJobs = jobs.filter((j) => appliedJobIds.includes(j.id));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Başvurularım</Text>
        {appliedJobs.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{appliedJobs.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={appliedJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const gradient = GRADIENTS[item.accentIndex % GRADIENTS.length];
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(item.url).catch(() => {})}
            >
              <LinearGradient colors={gradient} style={styles.logo}>
                <Text style={styles.logoText}>{item.company.charAt(0).toUpperCase()}</Text>
              </LinearGradient>

              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.meta}>{item.company} · {item.location}</Text>
                <Text style={styles.time}>{timeAgo(item.postedAt)}</Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: `${COLORS.success}18`, borderColor: `${COLORS.success}44` }]}>
                <Text style={[styles.statusText, { color: COLORS.success }]}>Başvuruldu</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📨</Text>
            <Text style={styles.emptyTitle}>Henüz başvurmadın</Text>
            <Text style={styles.emptyDesc}>
              İlanlara başvurdukça burada takip edebilirsin.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  heading: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: RADII.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  countText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
    paddingVertical: SPACING.sm + 4,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: RADII.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  time: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: SPACING.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
