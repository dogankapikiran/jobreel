import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import type { CvParsed } from '@/services/api';

interface Props {
  cvParsed: CvParsed | null;
  cvLoading: boolean;
  colors: ThemeColors;
  onPickCv: () => void;
  onViewCv: () => void;
}

export default function CvSection({ cvParsed, cvLoading, colors, onPickCv, onViewCv }: Props) {
  const styles = makeStyles(colors);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>CV / Özgeçmiş</Text>
      {cvParsed ? (
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📄</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoValue, { color: colors.text }]}>{cvParsed.title || 'CV yüklendi'}</Text>
              <Text style={styles.infoLabel}>
                {Array.isArray(cvParsed.skills) ? cvParsed.skills.length : 0} yetenek ·{' '}
                {Array.isArray(cvParsed.experience) ? cvParsed.experience.length : 0} deneyim
              </Text>
            </View>
            {cvLoading ? (
              <ActivityIndicator size="small" color={colors.textMuted} />
            ) : (
              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                <TouchableOpacity onPress={onViewCv} hitSlop={8} activeOpacity={0.7}>
                  <Text style={[styles.cvActionLink, { color: colors.isDark ? colors.textMuted : colors.accent }]}>
                    Görüntüle
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onPickCv} hitSlop={8} activeOpacity={0.7}>
                  <Text style={[styles.cvActionLink, { color: colors.isDark ? colors.textMuted : colors.accent }]}>
                    Güncelle
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.cvUploadBtn}
          onPress={onPickCv}
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
                <Text style={[styles.cvUploadText, { color: colors.text }]}>CV Yükle (PDF)</Text>
                <Text style={styles.cvUploadSub}>İlan eşleşme skorunuzu artırın</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    section: { gap: SPACING.sm },
    sectionTitle: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    card: {
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
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm + 4,
      padding: SPACING.md,
    },
    infoIcon: { fontSize: 18, width: 24, textAlign: 'center' },
    infoContent: { flex: 1 },
    infoLabel: { color: c.textMuted, fontSize: FONT_SIZES.xs, marginBottom: 2 },
    infoValue: { fontSize: FONT_SIZES.sm, fontWeight: '500' },
    cvActionLink: {
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
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
    cvUploadText: { fontSize: FONT_SIZES.md, fontWeight: '700' },
    cvUploadSub: { color: c.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
  });
}
