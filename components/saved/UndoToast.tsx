import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { BOTTOM_NAV_HEIGHT, FONT_SIZES, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface UndoToastProps {
  visible: boolean;
  onUndo: () => void;
  bottomOffset: number;
}

export default function UndoToast({ visible, onUndo, bottomOffset }: UndoToastProps) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [visible, anim]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.toast,
        { bottom: bottomOffset + BOTTOM_NAV_HEIGHT - 4 },
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.toastText}>Kaydedilenlerden kaldırıldı</Text>
      <TouchableOpacity onPress={onUndo} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.toastUndo}>Geri Al</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    toast: {
      position: 'absolute',
      left: 14,
      right: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      zIndex: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: c.isDark ? 0.4 : 0.1,
      shadowRadius: 16,
      elevation: 6,
    },
    toastText: {
      color: c.text,
      fontSize: FONT_SIZES.sm,
      fontWeight: '500',
    },
    toastUndo: {
      color: '#7c6dfa',
      fontSize: FONT_SIZES.sm,
      fontWeight: '700',
    },
  });
