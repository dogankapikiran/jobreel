import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { api } from '@/services/api';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function CvUploadScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { setProfile } = useUserStore();

  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [parsedSkillCount, setParsedSkillCount] = useState(0);

  async function handlePickCv() {
    let getDocumentAsync: typeof import('expo-document-picker').getDocumentAsync;
    try {
      const mod = require('expo-document-picker');
      getDocumentAsync = mod.getDocumentAsync ?? mod.default?.getDocumentAsync;
    } catch {
      return;
    }

    const result = await getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const file = result.assets[0];
      const { signedUrl } = await api.getCvUploadUrl();

      const fileResponse = await fetch(file.uri);
      const blob = await fileResponse.blob();
      const controller = new AbortController();
      const uploadTimeout = setTimeout(() => controller.abort(), 30000);
      try {
        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/pdf' },
          body: blob,
          signal: controller.signal,
        });
        clearTimeout(uploadTimeout);
        if (!uploadRes.ok) throw new Error(`Upload HTTP ${uploadRes.status}`);
      } catch (e) {
        clearTimeout(uploadTimeout);
        throw e;
      }

      const { parsed } = await api.parseCv();

      setProfile({
        name: parsed.name || '',
        title: parsed.title || '',
        summary: parsed.summary || '',
        skills: parsed.skills || [],
      });

      setParsedSkillCount(parsed.skills?.length ?? 0);
      setUploaded(true);
    } catch {
    } finally {
      setUploading(false);
    }
  }

  function handleContinue() {
    router.push('/onboarding/cv');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '66%' }]} />
        </View>
        <Text style={styles.step}>2/3</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>CV Yükle</Text>
          <Text style={styles.subtitle}>
            CV'ni yükle, formunu otomatik dolduralım.{'\n'}
            Şimdilik atlayıp kendin de doldurabilirsin.
          </Text>
        </View>

        {/* Upload card */}
        <TouchableOpacity
          style={[styles.uploadCard, uploaded && styles.uploadCardDone]}
          onPress={uploaded ? undefined : handlePickCv}
          activeOpacity={uploading || uploaded ? 1 : 0.8}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <ActivityIndicator size="large" color={colors.isDark ? colors.textMuted : colors.accent} />
              <Text style={styles.uploadingText}>CV yükleniyor ve analiz ediliyor...</Text>
            </>
          ) : uploaded ? (
            <>
              <View style={styles.doneIcon}>
                <Ionicons name="checkmark-circle" size={48} color="#2ecc71" />
              </View>
              <Text style={styles.doneTitle}>CV Analiz Edildi</Text>
              <Text style={styles.doneDesc}>
                {parsedSkillCount > 0
                  ? `${parsedSkillCount} yetenek ve profil bilgilerin hazırlandı.`
                  : 'Profil bilgilerin hazırlandı.'}
              </Text>
            </>
          ) : (
            <>
              <View style={styles.uploadIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={40}
                  color={colors.isDark ? colors.textMuted : colors.accent}
                />
              </View>
              <Text style={styles.uploadTitle}>PDF CV Seç</Text>
              <Text style={styles.uploadDesc}>
                Telefonundaki PDF dosyasını seç
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Supported format note */}
        {!uploaded && !uploading && (
          <Text style={styles.formatNote}>Desteklenen format: PDF</Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {uploaded ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Devam →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, uploading && { opacity: 0.6 }]}
            onPress={uploading ? undefined : handlePickCv}
            activeOpacity={0.85}
            disabled={uploading}
          >
            {uploading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>CV Yükle</Text>
            }
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.7} disabled={uploading}>
          <Text style={[styles.skipText, uploading && { opacity: 0.4 }]}>Şimdilik atla</Text>
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
    content: {
      flex: 1,
      padding: SPACING.lg,
      gap: SPACING.xl,
      justifyContent: 'center',
    },
    textBlock: {
      gap: SPACING.sm,
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
      lineHeight: 22,
    },
    uploadCard: {
      backgroundColor: c.bgDeep,
      borderWidth: 2,
      borderColor: c.cardBorder,
      borderStyle: 'dashed',
      borderRadius: RADII.xl,
      padding: SPACING.xxl,
      alignItems: 'center',
      gap: SPACING.md,
    },
    uploadCardDone: {
      borderStyle: 'solid',
      borderColor: 'rgba(46,204,113,0.4)',
      backgroundColor: 'rgba(46,204,113,0.06)',
    },
    uploadIcon: {
      width: 72,
      height: 72,
      borderRadius: RADII.xl,
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.07)' : 'rgba(5,22,80,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadTitle: {
      color: c.text,
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
    },
    uploadDesc: {
      color: c.textMuted,
      fontSize: FONT_SIZES.sm,
      textAlign: 'center',
    },
    uploadingText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.sm,
      textAlign: 'center',
      marginTop: SPACING.sm,
    },
    doneIcon: {
      marginBottom: SPACING.xs,
    },
    doneTitle: {
      color: '#2ecc71',
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
    },
    doneDesc: {
      color: c.textMuted,
      fontSize: FONT_SIZES.sm,
      textAlign: 'center',
    },
    formatNote: {
      color: c.textDim,
      fontSize: FONT_SIZES.xs,
      textAlign: 'center',
    },
    footer: {
      padding: SPACING.lg,
      paddingTop: SPACING.sm,
      gap: SPACING.sm,
      alignItems: 'center',
    },
    primaryBtn: {
      width: '100%',
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
    primaryBtnText: {
      color: '#ffffff',
      fontSize: FONT_SIZES.lg,
      fontWeight: '800',
    },
    skipText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.sm,
    },
  });
}
