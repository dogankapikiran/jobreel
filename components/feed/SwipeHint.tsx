import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZES } from '@/constants/theme';

interface SwipeHintProps {
  visible: boolean;
  fadeAnim: Animated.Value;
  bounceAnim: Animated.Value;
}

export default function SwipeHint({ visible, fadeAnim, bounceAnim }: SwipeHintProps) {
  if (!visible) return null;

  return (
    <Animated.View style={[styles.swipeHintContainer, { opacity: fadeAnim }]} pointerEvents="none">
      <View style={styles.swipeHint}>
        <Ionicons name="chevron-up-outline" size={18} color="rgba(255,255,255,0.8)" />
        <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
          <Ionicons name="swap-vertical-outline" size={28} color="#ffffff" />
        </Animated.View>
        <Text style={styles.swipeHintText}>Kaydır</Text>
        <Ionicons name="chevron-down-outline" size={18} color="rgba(255,255,255,0.8)" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  swipeHintContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  swipeHint: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  swipeHintText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
