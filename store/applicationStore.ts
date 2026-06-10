import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '@/types';
import { safeJSONStorage } from './safeStorage';
import { registerStoreCleanup } from './cleanupRegistry';

interface ApplicationState {
  appliedJobs: Job[];
  appliedTimestamps: Record<string, number>;
  markApplied: (job: Job) => void;
  isApplied: (jobId: string) => boolean;
  markJobClosed: (jobId: string) => void;
  reset: () => void;
}

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set, get) => ({
      appliedJobs: [],
      appliedTimestamps: {},

      markApplied: (job) =>
        set((state) => {
          if (state.appliedJobs.find((j) => j.id === job.id)) return {};
          return {
            appliedJobs: [job, ...state.appliedJobs],
            appliedTimestamps: {
              ...state.appliedTimestamps,
              [job.id]: Date.now(),
            },
          };
        }),

      isApplied: (jobId) => get().appliedJobs.some((j) => j.id === jobId),

      markJobClosed: (jobId) =>
        set((state) => ({
          appliedJobs: state.appliedJobs.map((j) =>
            j.id === jobId ? { ...j, isClosed: true } : j
          ),
        })),

      reset: () => {
        AsyncStorage.removeItem('jobreel-applied').catch(() => {});
        set({
          appliedJobs: [],
          appliedTimestamps: {},
        });
      },
    }),
    {
      name: 'jobreel-applied',
      storage: safeJSONStorage,
    }
  )
);

registerStoreCleanup(() => useApplicationStore.getState().reset());
