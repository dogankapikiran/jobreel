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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Seniority, WorkType } from '@/types';
import { SavedSearch, useSearchStore } from '@/store/searchStore';
import { FONT_SIZES, RADII, SPACING, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

import SavedSearches from './filter/SavedSearches';
import WorkTypeSelector from './filter/WorkTypeSelector';
import SenioritySelector from './filter/SenioritySelector';
import ScoreSelector from './filter/ScoreSelector';

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
    onApply({
      keyword: s.keyword,
      location: s.location,
      workType: s.workType,
      seniority: s.seniority,
      minScore: s.minScore ?? 0,
    });
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
          <SavedSearches
            savedSearches={savedSearches}
            onLoadSaved={handleLoadSaved}
            onRemoveSearch={removeSearch}
          />

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
          <WorkTypeSelector value={workType} onChange={setWorkType} />

          {/* Kıdem — çoklu seçim */}
          <SenioritySelector value={seniority} onChange={setSeniority} />

          {/* Eşleşme Skoru */}
          <ScoreSelector value={minScore} onChange={setMinScore} />
        </ScrollView>

        {/* Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Aramayı Kaydet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
            <Text style={styles.applyText}>Uygula</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    input: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: RADII.md,
      padding: SPACING.md,
      color: colors.text,
      fontSize: FONT_SIZES.sm,
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
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyText: {
      color: '#ffffff',
      fontSize: FONT_SIZES.md,
      fontWeight: '800',
    },
  });
