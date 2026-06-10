import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';

interface Props {
  visible: boolean;
  colors: ThemeColors;
  insets: { bottom: number };
  initialSkills: string[];
  suggestedSkills: string[];
  onSave: (newSkills: string[]) => Promise<void>;
  onClose: () => void;
}

export default function SkillsEditorModal({
  visible,
  colors,
  insets,
  initialSkills,
  suggestedSkills,
  onSave,
  onClose,
}: Props) {
  const [draftSkills, setDraftSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraftSkills([...initialSkills]);
      setCustomSkillInput('');
    }
  }, [visible, initialSkills]);

  function toggleDraftSkill(s: string) {
    setDraftSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function addCustomDraftSkill() {
    const trimmed = customSkillInput.trim();
    if (trimmed && !draftSkills.includes(trimmed)) {
      setDraftSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkillInput('');
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draftSkills);
    } finally {
      setSaving(false);
    }
  }

  const styles = makeStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.sheetBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetKeyboard}
      >
        <View style={[styles.sheet, styles.skillsSheet, { paddingBottom: insets.bottom + SPACING.lg }]}>
          <View style={styles.sheetHandle} />
          
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Yetenekler</Text>
            <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <SkillInputRow
            colors={colors}
            value={customSkillInput}
            onChangeText={setCustomSkillInput}
            onSubmit={addCustomDraftSkill}
          />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SkillChipsList
              colors={colors}
              suggestedSkills={suggestedSkills}
              draftSkills={draftSkills}
              onToggleSkill={toggleDraftSkill}
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.skillsSaveBtn, { backgroundColor: colors.isDark ? 'rgba(226,232,245,0.15)' : colors.accent }]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.skillsSaveBtnText}>Kaydet ({draftSkills.length} yetenek)</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

interface SkillInputRowProps {
  colors: ThemeColors;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
}

function SkillInputRow({ colors, value, onChangeText, onSubmit }: SkillInputRowProps) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.skillInputRow}>
      <TextInput
        style={[styles.skillInputField, { color: colors.text, borderColor: colors.cardBorder }]}
        value={value}
        onChangeText={onChangeText}
        placeholder="Yetenek ekle..."
        placeholderTextColor={colors.textDim}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
      />
      <TouchableOpacity
        style={[styles.skillAddBtn, { backgroundColor: colors.isDark ? colors.bgDeep : colors.accent, borderColor: colors.cardBorder }]}
        onPress={onSubmit}
        activeOpacity={0.8}
      >
        <Text style={styles.skillAddBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

interface SkillChipsListProps {
  colors: ThemeColors;
  suggestedSkills: string[];
  draftSkills: string[];
  onToggleSkill: (skill: string) => void;
}

function SkillChipsList({ colors, suggestedSkills, draftSkills, onToggleSkill }: SkillChipsListProps) {
  const styles = makeStyles(colors);
  const customSkills = draftSkills.filter((s) => !suggestedSkills.includes(s));

  return (
    <View style={styles.skillChipsWrap}>
      {suggestedSkills.map((s) => {
        const active = draftSkills.includes(s);
        return (
          <TouchableOpacity
            key={s}
            style={[styles.skillEditorChip, active && styles.skillEditorChipActive]}
            onPress={() => onToggleSkill(s)}
            activeOpacity={0.8}
          >
            <Text style={[styles.skillEditorChipText, active && styles.skillEditorChipTextActive]}>{s}</Text>
          </TouchableOpacity>
        );
      })}
      {customSkills.map((s) => (
        <TouchableOpacity
          key={s}
          style={[styles.skillEditorChip, styles.skillEditorChipActive, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}
          onPress={() => onToggleSkill(s)}
          activeOpacity={0.8}
        >
          <Text style={[styles.skillEditorChipText, styles.skillEditorChipTextActive]}>{s}</Text>
          <Ionicons name="close" size={10} color={colors.isDark ? colors.text : '#ffffff'} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    sheetBackdrop: {
      flex: 1,
      backgroundColor: c.isDark ? 'rgba(0,5,20,0.65)' : 'rgba(5,22,80,0.30)',
    },
    sheet: {
      backgroundColor: c.cardBg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.sm,
      maxHeight: '70%',
      borderTopWidth: 1,
      borderColor: c.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: c.isDark ? 0.4 : 0.08,
      shadowRadius: 20,
      elevation: 10,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      backgroundColor: c.cardBorder,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: SPACING.md,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.md,
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: c.cardBorder,
    },
    sheetTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
    },
    sheetCloseBtn: {
      width: 30,
      height: 30,
      backgroundColor: c.bgDeep,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetKeyboard: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    skillsSheet: {
      maxHeight: '80%',
    },
    skillInputRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    skillInputField: {
      flex: 1,
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderRadius: RADII.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontSize: FONT_SIZES.md,
    },
    skillAddBtn: {
      width: 48,
      borderWidth: c.isDark ? 1 : 0,
      borderRadius: RADII.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skillAddBtnText: { color: '#ffffff', fontSize: 24, fontWeight: '300' },
    skillChipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      paddingBottom: SPACING.md,
    },
    skillEditorChip: {
      paddingHorizontal: SPACING.sm + 4,
      paddingVertical: SPACING.xs + 4,
      borderRadius: RADII.full,
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    skillEditorChipActive: {
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.18)' : c.accent,
      borderColor: c.isDark ? 'rgba(226,232,245,0.35)' : c.accent,
    },
    skillEditorChipText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.sm,
      fontWeight: '500',
    },
    skillEditorChipTextActive: { color: c.isDark ? c.text : '#ffffff' },
    skillsSaveBtn: {
      height: 52,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: 'rgba(226,232,245,0.30)',
      borderRadius: RADII.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.sm,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: c.isDark ? 0 : 0.28,
      shadowRadius: 14,
      elevation: c.isDark ? 0 : 4,
    },
    skillsSaveBtnText: { color: '#ffffff', fontSize: FONT_SIZES.md, fontWeight: '700' },
  });
}
