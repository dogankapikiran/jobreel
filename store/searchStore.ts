import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Seniority, WorkType } from '@/types';
import { safeJSONStorage } from './safeStorage';

export interface SavedSearch {
  id: string;
  keyword: string;
  location: string;
  workType: WorkType | 'any';
  seniority: Seniority[];
  minScore: number;
  savedAt: number;
}

interface SearchState {
  savedSearches: SavedSearch[];
  recentSearches: string[];
  saveSearch: (search: Omit<SavedSearch, 'id' | 'savedAt'>) => void;
  removeSearch: (id: string) => void;
  addRecentSearch: (keyword: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      savedSearches: [],
      recentSearches: [],

      saveSearch: (search) =>
        set((state) => ({
          savedSearches: [
            { ...search, id: Date.now().toString(), savedAt: Date.now() },
            ...state.savedSearches,
          ].slice(0, 8),
        })),

      removeSearch: (id) =>
        set((state) => ({
          savedSearches: state.savedSearches.filter((s) => s.id !== id),
        })),

      addRecentSearch: (keyword) =>
        set((state) => ({
          recentSearches: [
            keyword,
            ...state.recentSearches.filter((k) => k !== keyword),
          ].slice(0, 8),
        })),

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'jobreel-searches-v1',
      storage: safeJSONStorage,
    }
  )
);

export function searchLabel(s: SavedSearch): string {
  const parts: string[] = [];
  if (s.keyword) parts.push(s.keyword);
  const wtLabels: Record<string, string> = {
    remote: 'Remote', hybrid: 'Hibrit', office: 'Ofis', any: '',
  };
  if (s.workType !== 'any') parts.push(wtLabels[s.workType] ?? s.workType);
  const snLabels: Record<string, string> = {
    junior: 'Junior', mid: 'Mid', senior: 'Senior', lead: 'Lead',
  };
  if (s.seniority.length) parts.push(s.seniority.map((x) => snLabels[x] ?? x).join(', '));
  if (s.location && s.location !== 'Istanbul, Turkey') parts.push(s.location);
  if (s.minScore > 0) parts.push(`≥${s.minScore}%`);
  return parts.filter(Boolean).join(' · ') || 'Genel Arama';
}
