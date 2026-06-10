import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobAlert } from '@/services/api';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import {
  DEFAULT_FORM,
  WT_OPTIONS,
  SN_OPTIONS,
  normalizeLocationDisplay,
} from '@/constants/alertOptions';

interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  editingAlert: JobAlert | null;
  onSubmit: (form: typeof DEFAULT_FORM) => Promise<void>;
  sectorOptions: string[];
  defaultLocation: string;
  colors: ThemeColors;
  insets: { top: number; bottom: number };
}

export default function AlertModal({
  visible,
  onClose,
  editingAlert,
  onSubmit,
  sectorOptions,
  defaultLocation,
  colors,
  insets,
}: AlertModalProps) {
  const styles = makeStyles(colors);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingAlert) {
        setForm({
          keyword: editingAlert.keyword,
          location: normalizeLocationDisplay(editingAlert.location),
          work_type: editingAlert.work_type,
          seniority: editingAlert.seniority ?? [],
          sectors: editingAlert.sectors ?? [],
        });
      } else {
        setForm({
          ...DEFAULT_FORM,
          location: normalizeLocationDisplay(defaultLocation),
        });
      }
    }
  }, [visible, editingAlert, defaultLocation]);

  function toggleSeniority(val: string) {
    setForm((prev) => ({
      ...prev,
      seniority: prev.seniority.includes(val)
        ? prev.seniority.filter((s) => s !== val)
        : [...prev.seniority, val],
    }));
  }

  function toggleSector(val: string) {
    setForm((prev) => ({
      ...prev,
      sectors: prev.sectors.includes(val)
        ? prev.sectors.filter((s) => s !== val)
        : [...prev.sectors, val],
    }));
  }

  async function handleSubmit() {
    const trimmed = form.keyword.trim();
    if (!trimmed && form.sectors.length === 0) {
      Alert.alert('Eksik alan', 'Anahtar kelime gir veya en az bir sektör seç.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        Keyboard.dismiss();
        onClose();
      }}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => {
          Keyboard.dismiss();
          onClose();
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalWrapper}
      >
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + SPACING.md }]}>
          <View style={styles.handle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingAlert ? 'Alarmı Düzenle' : 'Yeni Alarm'}</Text>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                onClose();
              }}
              hitSlop={12}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 80 }}
          >
            <FormInput
              label="Anahtar Kelime"
              placeholder="örn. React Native, Product Manager"
              value={form.keyword}
              onChangeText={(v) => setForm((p) => ({ ...p, keyword: v }))}
              colors={colors}
              autoCapitalize="none"
              returnKeyType="next"
            />

            <FormInput
              label="Konum"
              placeholder="İstanbul, Ankara, Remote..."
              value={form.location}
              onChangeText={(v) => setForm((p) => ({ ...p, location: v }))}
              colors={colors}
              autoCapitalize="words"
              returnKeyType="done"
              containerStyle={{ marginTop: SPACING.md }}
            />

            <ChipSelector
              label="Çalışma Şekli"
              options={WT_OPTIONS}
              selectedValue={form.work_type}
              onSelect={(val) => setForm((p) => ({ ...p, work_type: val }))}
              colors={colors}
              containerStyle={{ marginTop: SPACING.md }}
            />

            <ChipSelector
              label="Seviye"
              options={SN_OPTIONS}
              selectedValues={form.seniority}
              onToggle={toggleSeniority}
              colors={colors}
              containerStyle={{ marginTop: SPACING.md }}
            />

            <ChipSelector
              label="Sektör"
              options={sectorOptions.map((s) => ({ label: s, value: s }))}
              selectedValues={form.sectors}
              onToggle={toggleSector}
              colors={colors}
              containerStyle={{ marginTop: SPACING.md, paddingBottom: SPACING.lg }}
            />
          </ScrollView>

          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            activeOpacity={0.8}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{editingAlert ? 'Kaydet' : 'Alarm Kur'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

interface FormInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  colors: ThemeColors;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  returnKeyType?: 'next' | 'done' | 'search' | 'send';
  containerStyle?: object;
}

function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  colors,
  autoCapitalize = 'none',
  returnKeyType = 'done',
  containerStyle,
}: FormInputProps) {
  const styles = makeStyles(colors);
  return (
    <View style={containerStyle}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        value={value}
        onChangeText={onChangeText}
        returnKeyType={returnKeyType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

interface Option {
  label: string;
  value: string;
}

interface ChipSelectorProps {
  label: string;
  options: Option[];
  selectedValue?: string;
  selectedValues?: string[];
  onSelect?: (value: string) => void;
  onToggle?: (value: string) => void;
  colors: ThemeColors;
  containerStyle?: object;
}

function ChipSelector({
  label,
  options,
  selectedValue,
  selectedValues,
  onSelect,
  onToggle,
  colors,
  containerStyle,
}: ChipSelectorProps) {
  const styles = makeStyles(colors);
  return (
    <View style={containerStyle}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const active = selectedValues
            ? selectedValues.includes(opt.value)
            : selectedValue === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => (onToggle ? onToggle(opt.value) : onSelect?.(opt.value))}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.isDark ? 'rgba(0,5,20,0.65)' : 'rgba(5,22,80,0.35)',
    },
    modalWrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    modalSheet: {
      backgroundColor: c.cardBg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.sm,
      maxHeight: '90%',
      borderTopWidth: 1,
      borderColor: c.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: c.isDark ? 0.4 : 0.08,
      shadowRadius: 20,
      elevation: 10,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.cardBorder,
      alignSelf: 'center',
      marginBottom: SPACING.md,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.lg,
    },
    modalTitle: {
      color: c.text,
      fontSize: FONT_SIZES.lg,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    fieldLabel: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: SPACING.xs,
    },
    input: {
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      color: c.text,
      fontSize: FONT_SIZES.sm,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.xs,
    },
    chip: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADII.full,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.bgDeep,
    },
    chipActive: {
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.18)' : c.accent,
      borderColor: c.isDark ? 'rgba(226,232,245,0.35)' : c.accent,
    },
    chipText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
    chipTextActive: {
      color: c.isDark ? c.text : '#ffffff',
    },
    submitBtn: {
      marginTop: SPACING.xl,
      marginBottom: SPACING.sm,
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.15)' : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: 'rgba(226,232,245,0.30)',
      borderRadius: RADII.lg,
      paddingVertical: SPACING.md,
      alignItems: 'center',
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: c.isDark ? 0 : 0.28,
      shadowRadius: 14,
      elevation: c.isDark ? 0 : 4,
    },
    submitText: {
      color: '#fff',
      fontSize: FONT_SIZES.md,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
  });
