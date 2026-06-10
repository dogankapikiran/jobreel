import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from '@/types';
import { safeJSONStorage } from './safeStorage';
import { registerStoreCleanup } from './cleanupRegistry';

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

  setProfile: (partial: Partial<UserProfile>) => void;
  setPreferences: (partial: Partial<UserProfile['preferences']>) => void;
  reset: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,

      setProfile: (partial) =>
        set((state) => ({ profile: { ...state.profile, ...partial } })),

      setPreferences: (partial) =>
        set((state) => ({
          profile: {
            ...state.profile,
            preferences: { ...state.profile.preferences, ...partial },
          },
        })),

      reset: async () => {
        set({ profile: DEFAULT_PROFILE });
      },
    }),
    {
      name: 'jobreel-user',
      storage: safeJSONStorage,
      merge: (persisted: unknown, current: UserState): UserState => {
        const p = (persisted !== null && typeof persisted === 'object')
          ? (persisted as Partial<UserState>)
          : null;
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

registerStoreCleanup(() => useUserStore.getState().reset());
