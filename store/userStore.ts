import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Interaction, UserProfile } from '@/types';
import { safeJSONStorage } from './safeStorage';

const DEFAULT_PREFERENCES: UserProfile['preferences'] = {
  sectors: [],
  seniority: [],
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
    }),
    {
      name: 'jobreel-user',
      storage: safeJSONStorage,
      merge: (persisted: unknown, current: UserState): UserState => {
        const p = persisted as Partial<UserState> | null;
        return {
          ...current,
          ...p,
          profile: {
            ...current.profile,
            ...(p?.profile ?? {}),
            skills: p?.profile?.skills ?? current.profile.skills,
            experience: p?.profile?.experience ?? current.profile.experience,
            education: p?.profile?.education ?? current.profile.education,
            preferences: {
              ...current.profile.preferences,
              ...(p?.profile?.preferences ?? {}),
            },
          },
        };
      },
    }
  )
);
