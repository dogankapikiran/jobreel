import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Interaction, UserProfile } from '@/types';

const DEFAULT_PREFERENCES: UserProfile['preferences'] = {
  sectors: [],
  seniority: 'mid',
  workType: 'any',
  location: 'İstanbul',
  salaryMin: 0,
  skills: [],
};

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  title: '',
  summary: '',
  location: 'İstanbul',
  skills: [],
  experience: [],
  education: [],
  preferences: DEFAULT_PREFERENCES,
};

interface UserState {
  profile: UserProfile;
  interactions: Interaction[];
  hasCompletedOnboarding: boolean;

  setProfile: (partial: Partial<UserProfile>) => void;
  setPreferences: (partial: Partial<UserProfile['preferences']>) => void;
  addInteraction: (interaction: Interaction) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      interactions: [],
      hasCompletedOnboarding: false,

      setProfile: (partial) =>
        set((state) => ({ profile: { ...state.profile, ...partial } })),

      setPreferences: (partial) =>
        set((state) => ({
          profile: {
            ...state.profile,
            preferences: { ...state.profile.preferences, ...partial },
          },
        })),

      addInteraction: (interaction) =>
        set((state) => ({
          interactions: [interaction, ...state.interactions].slice(0, 500),
        })),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      resetOnboarding: () =>
        set({ hasCompletedOnboarding: false, profile: DEFAULT_PROFILE, interactions: [] }),
    }),
    {
      name: 'jobreel-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
