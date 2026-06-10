import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZES, SPACING, ThemeColors } from '@/constants/theme';

interface DescItem {
  kind: string;
  text: string;
}

interface Props {
  descLoading: boolean;
  descError: boolean;
  descItems: DescItem[];
  colors: ThemeColors;
}

export default function JobDescriptionSection({
  descLoading,
  descError,
  descItems,
  colors,
}: Props) {
  const styles = makeStyles(colors);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>İş Tanımı</Text>
      {descLoading ? (
        <View style={styles.descLoadingRow}>
          <ActivityIndicator
            size="small"
            color={colors.isDark ? colors.textMuted : colors.accent}
          />
          <Text style={styles.descLoading}>Açıklama yükleniyor...</Text>
        </View>
      ) : descError ? (
        <Text style={styles.descError}>
          Açıklama yüklenemedi. İnternet bağlantınızı kontrol edin.
        </Text>
      ) : descItems.length > 0 ? (
        descItems.map((item, i) => {
          if (item.kind === 'head') {
            return (
              <Text key={i} style={styles.descSubHead}>
                {item.text}
              </Text>
            );
          }
          if (item.kind === 'bullet') {
            return (
              <View key={i} style={styles.bulletRow}>
                <Text
                  style={[
                    styles.bulletDot,
                    { color: colors.isDark ? colors.textMuted : colors.accent },
                  ]}
                >
                  •
                </Text>
                <Text style={styles.bulletText}>{item.text}</Text>
              </View>
            );
          }
          return (
            <Text key={i} style={styles.description}>
              {item.text}
            </Text>
          );
        })
      ) : (
        <Text style={styles.descLoading}>Açıklama bulunamadı.</Text>
      )}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    section: {
      gap: SPACING.sm,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      marginBottom: SPACING.xs,
    },
    descLoadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.sm,
    },
    descLoading: {
      color: colors.textDim,
      fontSize: FONT_SIZES.sm,
      fontStyle: 'italic',
    },
    descError: {
      color: '#ef4444',
      fontSize: FONT_SIZES.sm,
    },
    descSubHead: {
      color: colors.text,
      fontSize: FONT_SIZES.sm,
      fontWeight: '700',
      marginTop: SPACING.sm,
      marginBottom: SPACING.xs,
    },
    description: {
      color: colors.textMuted,
      fontSize: FONT_SIZES.sm,
      lineHeight: 22,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.sm,
    },
    bulletDot: {
      fontSize: FONT_SIZES.sm,
      lineHeight: 22,
      flexShrink: 0,
    },
    bulletText: {
      flex: 1,
      color: colors.textMuted,
      fontSize: FONT_SIZES.sm,
      lineHeight: 22,
    },
  });
}
