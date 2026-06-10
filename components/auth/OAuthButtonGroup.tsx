import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { FONT_SIZES, RADII, ThemeColors } from '@/constants/theme';

interface Props {
  busy: boolean;
  colors: ThemeColors;
  onAppleSignIn: () => void;
  onGoogleSignIn: () => void;
}

export default function OAuthButtonGroup({
  busy,
  colors,
  onAppleSignIn,
  onGoogleSignIn,
}: Props) {
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={
            colors.isDark
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={RADII.full}
          style={[styles.appleBtn, busy && { opacity: 0.5 }]}
          onPress={busy ? () => {} : onAppleSignIn}
        />
      )}

      <TouchableOpacity
        style={styles.googleBtn}
        onPress={onGoogleSignIn}
        activeOpacity={0.8}
        disabled={busy}
      >
        <Text style={styles.googleBtnText}>G  Google ile Devam Et</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      width: '100%',
      gap: 12,
    },
    appleBtn: {
      height: 50,
      width: '100%',
    },
    googleBtn: {
      backgroundColor: c.bgDeep,
      borderRadius: RADII.full,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.cardBorder,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0 : 0.08,
      shadowRadius: 8,
      elevation: c.isDark ? 0 : 2,
    },
    googleBtnText: {
      color: c.text,
      fontWeight: '700',
      fontSize: FONT_SIZES.md,
    },
  });
}
