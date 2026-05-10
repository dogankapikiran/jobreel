import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Seniority, WorkType } from '@/types';
import { SavedSearch, searchLabel, useSearchStore } from '@/store/searchStore';
import { FONT_SIZES, GRADIENTS, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const WORK_TYPES: { value: WorkType | 'any'; label: string; icon: string }[] = [
  { value: 'any',    label: 'Farketmez', icon: '🔀' },
  { value: 'remote', label: 'Remote',    icon: '🌍' },
  { value: 'hybrid', label: 'Hibrit',    icon: '🏠' },
  { value: 'office', label: 'Ofis',      icon: '🏢' },
];

const SENIORITY_OPTIONS: { value: Seniority; label: string; desc: string }[] = [
  { value: 'junior', label: 'Junior',        desc: '0–2 yıl' },
  { value: 'mid',    label: 'Mid-Level',     desc: '2–5 yıl' },
  { value: 'senior', label: 'Senior',        desc: '5–8 yıl' },
  { value: 'lead',   label: 'Lead/Principal', desc: '8+ yıl' },
];

export interface FilterState {
  keyword: string;
  location: string;
  workType: WorkType | 'any';
  seniority: Seniority[];
  minScore: number;
}

interface Props {
  visible: boolean;
  current: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}

export default function FilterSheet({ visible, current, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { savedSearches, saveSearch, removeSearch } = useSearchStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [keyword, setKeyword]   = useState(current.keyword);
  const [location, setLocation] = useState(current.location);
  const [workType, setWorkType] = useState<WorkType | 'any'>(current.workType);
  const [seniority, setSeniority] = useState<Seniority[]>(current.seniority);
  const [minScore, setMinScore] = useState(current.minScore);

  function toggleSeniority(v: Seniority) {
    setSeniority((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  function handleReset() {
    setKeyword('');
    setLocation('Istanbul, Turkey');
    setWorkType('any');
    setSeniority([]);
    setMinScore(0);
  }

  function handleApply() {
    onApply({ keyword, location, workType, seniority, minScore });
    onClose();
  }

  function handleSave() {
    saveSearch({ keyword, location, workType, seniority, minScore });
  }

  function handleLoadSaved(s: SavedSearch) {
    setKeyword(s.keyword);
    setLocation(s.location);
    setWorkType(s.workType);
    setSeniority(s.seniority);
    setMinScore(s.minScore ?? 0);
    onApply({ keyword: s.keyword, location: s.location, workType: s.workType, seniority: s.seniority, minScore: s.minScore ?? 0 });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.md }]}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.actionText}>Sıfırla</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filtrele</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.actionText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Kayıtlı aramalar */}
          {savedSearches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Kayıtlı Aramalar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.savedRow}>
                  {savedSearches.map((s) => (
                    <View key={s.id} style={styles.savedChip}>
                      <TouchableOpacity onPress={() => handleLoadSaved(s)} style={styles.savedChipText}>
                        <Text style={styles.savedLabel} numberOfLines={1}>{searchLabel(s)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeSearch(s.id)} style={styles.savedRemove}>
                        <Text style={styles.savedRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Anahtar kelime */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pozisyon / Anahtar Kelime</Text>
            <TextInput
              style={styles.input}
              value={keyword}
              onChangeText={setKeyword}
              placeholder="React Native, Product Manager..."
              placeholderTextColor={colors.textDim}
            />
          </View>

          {/* Lokasyon */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Lokasyon</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Istanbul, Ankara, Remote..."
              placeholderTextColor={colors.textDim}
            />
          </View>

          {/* Çalışma tipi */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Çalışma Tipi</Text>
            <View style={styles.chipRow}>
              {WORK_TYPES.map((wt) => {
                const active = workType === wt.value;
                return (
                  <TouchableOpacity
                    key={wt.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setWorkType(wt.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chipIcon}>{wt.icon}</Text>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {wt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Kıdem — çoklu seçim */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Kıdem Seviyesi (Çoklu Seçim)</Text>
            <View style={styles.seniorityGrid}>
              {SENIORITY_OPTIONS.map((opt) => {
                const active = seniority.includes(opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.seniorityCard, active && styles.seniorityCardActive]}
                    onPress={() => toggleSeniority(opt.value)}
                    activeOpacity={0.8}
                  >
                    {active && <Text style={styles.checkmark}>✓</Text>}
                    <Text style={[styles.seniorityLabel, active && styles.seniorityLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.seniorityDesc}>{opt.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Eşleşme Skoru */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Minimum Eşleşme Skoru</Text>
            <View style={styles.chipRow}>
              {([
                { value: 0,  label: 'Tümü' },
                { value: 40, label: '≥40%' },
                { value: 60, label: '≥60%' },
                { value: 80, label: '≥80%' },
              ] as const).map((opt) => {
                const active = minScore === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.scoreChip, active && styles.scoreChipActive]}
                    onPress={() => setMinScore(opt.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.scoreChipText, active && styles.scoreChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </ScrollView>

        {/* Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Aramayı Kaydet</Text>
          </TouchableOpacity>
          <LinearGradient colors={GRADIENTS[0]} style={styles.applyBtn}>
            <TouchableOpacity style={styles.applyInner} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyText}>Uygula</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.bgDeep,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: colors.navBorder,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    color: colors.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  actionText: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.sm,
    minWidth: 52,
    textAlign: 'center',
  },
  section: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  savedRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: RADII.full,
    paddingLeft: SPACING.sm + 4,
    paddingRight: SPACING.xs,
    paddingVertical: SPACING.xs + 2,
    gap: 4,
  },
  savedChipText: {
    maxWidth: 160,
  },
  savedLabel: {
    color: colors.text,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  savedRemove: {
    padding: 4,
  },
  savedRemoveText: {
    color: colors.textDim,
    fontSize: 10,
  },
  input: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: RADII.md,
    padding: SPACING.md,
    color: colors.text,
    fontSize: FONT_SIZES.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  scoreChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADII.md,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  scoreChipActive: {
    backgroundColor: `${colors.accent}22`,
    borderColor: `${colors.accent}66`,
  },
  scoreChipText: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  scoreChipTextActive: {
    color: colors.accentLight,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADII.md,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 4,
  },
  chipActive: {
    backgroundColor: `${colors.accent}22`,
    borderColor: `${colors.accent}66`,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.accentLight,
  },
  seniorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  seniorityCard: {
    width: '47%',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: RADII.md,
    padding: SPACING.md,
    gap: 2,
  },
  seniorityCardActive: {
    backgroundColor: `${colors.accent}22`,
    borderColor: `${colors.accent}66`,
  },
  checkmark: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  seniorityLabel: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  seniorityLabelActive: {
    color: colors.text,
  },
  seniorityDesc: {
    color: colors.textDim,
    fontSize: FONT_SIZES.xs,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  saveBtnText: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1,
    borderRadius: RADII.full,
    height: 52,
  },
  applyInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: colors.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
  },
});
