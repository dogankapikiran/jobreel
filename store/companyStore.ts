import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CompanyState {
  following: string[];
  setFollowing: (companies: string[]) => void;
  follow: (company: string) => void;
  unfollow: (company: string) => void;
  isFollowing: (company: string) => boolean;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      following: [],

      setFollowing: (companies) => set({ following: companies }),

      follow: (company) =>
        set((state) => ({
          following: state.following.includes(company)
            ? state.following
            : [company, ...state.following],
        })),

      unfollow: (company) =>
        set((state) => ({
          following: state.following.filter((c) => c !== company),
        })),

      isFollowing: (company) => get().following.includes(company),
    }),
    {
      name: 'jobreel-companies',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
