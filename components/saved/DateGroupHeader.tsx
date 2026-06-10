import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface DateGroupHeaderProps {
  title: string;
}

export default function DateGroupHeader({ title }: DateGroupHeaderProps) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.groupHeader}>
      <Text style={styles.groupLabel}>{title.toUpperCase()}</Text>
      <View style={styles.groupLine} />
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingTop: 12,
      paddingBottom: 2,
      paddingHorizontal: 4,
    },
    groupLabel: {
      fontSize: 10.5,
      fontWeight: '600',
      letterSpacing: 1.2,
      color: c.textMuted,
    },
    groupLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.cardBorder,
    },
  });
