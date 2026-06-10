import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';

interface AuthGateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export default function AuthGate({ icon, title, description }: AuthGateProps) {
  const router = useRouter();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <LinearGradient
          colors={colors.isDark ? ['#1a2540', '#0d0d14'] : ['#f0f2f7', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={36} color={colors.isDark ? '#ffffff' : colors.accent} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <TouchableOpacity
          onPress={() => router.push('/auth')}
          style={styles.button}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Giriş Yap / Üye Ol</Text>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
      backgroundColor: c.bg,
    },
    card: {
      width: '100%',
      borderRadius: RADII.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: SPACING.xl,
      alignItems: 'center',
      gap: SPACING.md,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: c.isDark ? 0.3 : 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    iconCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(5,22,80,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.xs,
    },
    title: {
      color: c.text,
      fontSize: 22,
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: -0.4,
    },
    description: {
      color: c.textMuted,
      fontSize: FONT_SIZES.sm,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 260,
      marginBottom: SPACING.sm,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
      width: '100%',
      backgroundColor: c.isDark ? c.bgDeep : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.cardBorder,
      paddingVertical: SPACING.md,
      borderRadius: RADII.full,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.isDark ? 0 : 0.25,
      shadowRadius: 10,
      elevation: 3,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: FONT_SIZES.md,
      fontWeight: '700',
    },
  });
}
