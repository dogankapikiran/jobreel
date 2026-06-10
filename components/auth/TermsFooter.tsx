import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, router } from 'expo-router';
import { FONT_SIZES, SPACING, ThemeColors } from '@/constants/theme';

interface Props {
  colors: ThemeColors;
}

export default function TermsFooter({ colors }: Props) {
  const styles = makeStyles(colors);

  return (
    <View style={styles.termsFooter}>
      <Text style={styles.termsFooterText}>
        Giriş yaparak veya kayıt olarak{' '}
        <Text style={styles.termsLink} onPress={() => router.push('/terms' as Href)}>Kullanım Koşullarını</Text>
        {' ve '}
        <Text style={styles.termsLink} onPress={() => router.push('/privacy' as Href)}>Gizlilik Politikasını</Text>
        {' kabul etmiş olursunuz.'}
      </Text>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    termsFooter: {
      marginTop: SPACING.xs,
      paddingHorizontal: SPACING.sm,
    },
    termsFooterText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs - 1,
      textAlign: 'center',
      lineHeight: 16,
    },
    termsLink: {
      color: c.text,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
  });
}
