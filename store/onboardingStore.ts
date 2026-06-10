import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeJSONStorage } from './safeStorage';
import { registerStoreCleanup } from './cleanupRegistry';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  completedOnboardingUserIds: string[];
  completeOnboarding: () => void;
  markOnboardingComplete: (userId: string) => void;
  reset: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      completedOnboardingUserIds: [],

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      markOnboardingComplete: (userId) =>
        set((state) => ({
          completedOnboardingUserIds: state.completedOnboardingUserIds.includes(userId)
            ? state.completedOnboardingUserIds
            : [...state.completedOnboardingUserIds, userId],
        })),

      reset: async () => {
        // completedOnboardingUserIds is intentionally preserved so returning users skip onboarding
        set({ hasCompletedOnboarding: false });
      },
    }),
    {
      name: 'jobreel-onboarding',
      storage: safeJSONStorage,
      merge: (persisted: unknown, current: OnboardingState): OnboardingState => {
        const p = (persisted !== null && typeof persisted === 'object')
          ? (persisted as Partial<OnboardingState>)
          : null;
        return {
          ...current,
          ...p,
          completedOnboardingUserIds: p?.completedOnboardingUserIds ?? [],
        };
      },
    }
  )
);

registerStoreCleanup(() => useOnboardingStore.getState().reset());
