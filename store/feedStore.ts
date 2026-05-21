import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '@/types';
import { safeJSONStorage } from './safeStorage';

interface FeedState {
  jobs: Job[];
  savedJobs: Job[];
  savedTimestamps: Record<string, number>;
  appliedJobs: Job[];
  appliedTimestamps: Record<string, number>;
  currentIndex: number;
  isLoading: boolean;

  setJobs: (jobs: Job[]) => void;
  appendJobs: (jobs: Job[]) => void;
  updateJobs: (jobs: Job[]) => void;
  setCurrentIndex: (index: number) => void;
  setLoading: (loading: boolean) => void;
  saveJob: (job: Job) => void;
  unsaveJob: (jobId: string) => void;
  isSaved: (jobId: string) => boolean;
  markApplied: (job: Job) => void;
  isApplied: (jobId: string) => boolean;
  markJobClosed: (jobId: string) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>()(
  persist(
    (set, get) => ({
      jobs: [],
      savedJobs: [],
      savedTimestamps: {},
      appliedJobs: [],
      appliedTimestamps: {},
      currentIndex: 0,
      isLoading: false,

      setJobs: (jobs) => set({ jobs, currentIndex: 0 }),

      appendJobs: (newJobs) =>
        set((state) => {
          const existingIds = new Set(state.jobs.map((j) => j.id));
          return { jobs: [...state.jobs, ...newJobs.filter((j) => !existingIds.has(j.id))] };
        }),

      updateJobs: (incoming) =>
        set((state) => {
          const byId = new Map(incoming.map((j) => [j.id, j]));
          const existingIds = new Set(state.jobs.map((j) => j.id));
          const updated = state.jobs.map((j) => byId.get(j.id) ?? j);
          const appended = incoming.filter((j) => !existingIds.has(j.id));
          return { jobs: [...updated, ...appended] };
        }),

      setCurrentIndex: (currentIndex) => set({ currentIndex }),
      setLoading: (isLoading) => set({ isLoading }),

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
        AsyncStorage.removeItem('jobreel-feed-v2').catch(() => {});
        set({
          jobs: [],
          savedJobs: [],
          savedTimestamps: {},
          appliedJobs: [],
          appliedTimestamps: {},
          currentIndex: 0,
          isLoading: false,
        });
      },
    }),
    {
      name: 'jobreel-feed-v2',
      storage: safeJSONStorage,
      partialize: (state) => ({
        savedJobs: state.savedJobs,
        savedTimestamps: state.savedTimestamps,
        appliedJobs: state.appliedJobs,
        appliedTimestamps: state.appliedTimestamps,
      }),
    }
  )
);
