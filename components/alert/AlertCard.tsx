import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobAlert } from '@/services/api';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { alertLabel, alertSub } from '@/constants/alertOptions';

interface AlertCardProps {
  alert: JobAlert;
  onEdit: () => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  colors: ThemeColors;
}

export default function AlertCard({ alert, onEdit, onToggle, onDelete, colors }: AlertCardProps) {
  const styles = makeStyles(colors);

  return (
    <View style={styles.alertCard}>
      <TouchableOpacity style={styles.alertLeft} onPress={onEdit} activeOpacity={0.7}>
        <View style={styles.alertLabelRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertLabel}>{alertLabel(alert)}</Text>
            <Text style={styles.alertSub}>{alertSub(alert)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
      <View style={styles.alertActions}>
        <Switch
          value={alert.enabled}
          onValueChange={onToggle}
          trackColor={{
            false: colors.cardBorder,
            true: colors.isDark ? 'rgba(226,232,245,0.25)' : 'rgba(5,22,80,0.4)',
          }}
          thumbColor={alert.enabled
            ? (colors.isDark ? colors.text : colors.accent)
            : colors.textMuted
          }
          ios_backgroundColor={colors.cardBorder}
        />
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons name="close-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.lg,
      padding: SPACING.md,
      gap: SPACING.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: c.isDark ? 0.2 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    alertLeft: { flex: 1 },
    alertLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    alertLabel: {
      color: c.text,
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
    },
    alertSub: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      marginTop: 2,
    },
    alertActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    deleteBtn: { padding: 4 },
  });
}
