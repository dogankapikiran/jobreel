import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '@/types';
import { safeJSONStorage } from './safeStorage';
import { registerStoreCleanup } from './cleanupRegistry';

interface SavedState {
  savedJobs: Job[];
  savedTimestamps: Record<string, number>;
  saveJob: (job: Job) => void;
  unsaveJob: (jobId: string) => void;
  isSaved: (jobId: string) => boolean;
  reset: () => void;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedJobs: [],
      savedTimestamps: {},

      saveJob: (job) =>
        set((state) => {
          if (state.savedJobs.find((j) => j.id === job.id)) return {};
          return {
            savedJobs: [job, ...state.savedJobs],
            savedTimestamps: {
              ...state.savedTimestamps,
              [job.id]: state.savedTimestamps[job.id] ?? Date.now(),
            },
          };
        }),

      unsaveJob: (jobId) =>
        set((state) => {
          const { [jobId]: _dropped, ...remainingTs } = state.savedTimestamps;
          return {
            savedJobs: state.savedJobs.filter((j) => j.id !== jobId),
            savedTimestamps: remainingTs,
          };
        }),

      isSaved: (jobId) => get().savedJobs.some((j) => j.id === jobId),

      reset: () => {
        AsyncStorage.removeItem('jobreel-saved').catch(() => {});
        set({
          savedJobs: [],
          savedTimestamps: {},
        });
      },
    }),
    {
      name: 'jobreel-saved',
      storage: safeJSONStorage,
    }
  )
);

registerStoreCleanup(() => useSavedStore.getState().reset());
