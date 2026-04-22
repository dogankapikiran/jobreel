import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '@/types';

interface FeedState {
  jobs: Job[];
  savedJobs: Job[];
  appliedJobIds: string[];
  currentIndex: number;
  isLoading: boolean;

  setJobs: (jobs: Job[]) => void;
  appendJobs: (jobs: Job[]) => void;
  setCurrentIndex: (index: number) => void;
  setLoading: (loading: boolean) => void;
  saveJob: (job: Job) => void;
  unsaveJob: (jobId: string) => void;
  isSaved: (jobId: string) => boolean;
  markApplied: (jobId: string) => void;
  isApplied: (jobId: string) => boolean;
}

export const useFeedStore = create<FeedState>()(
  persist(
    (set, get) => ({
      jobs: [],
      savedJobs: [],
      appliedJobIds: [],
      currentIndex: 0,
      isLoading: false,

      setJobs: (jobs) => set({ jobs, currentIndex: 0 }),

      appendJobs: (newJobs) =>
        set((state) => ({
          jobs: [
            ...state.jobs,
            ...newJobs.filter((j) => !state.jobs.find((jj) => jj.id === j.id)),
          ],
        })),

      setCurrentIndex: (currentIndex) => set({ currentIndex }),
      setLoading: (isLoading) => set({ isLoading }),

      saveJob: (job) =>
        set((state) => ({
          savedJobs: state.savedJobs.find((j) => j.id === job.id)
            ? state.savedJobs
            : [job, ...state.savedJobs],
        })),

      unsaveJob: (jobId) =>
        set((state) => ({
          savedJobs: state.savedJobs.filter((j) => j.id !== jobId),
        })),

      isSaved: (jobId) => get().savedJobs.some((j) => j.id === jobId),

      markApplied: (jobId) =>
        set((state) => ({
          appliedJobIds: state.appliedJobIds.includes(jobId)
            ? state.appliedJobIds
            : [jobId, ...state.appliedJobIds],
        })),

      isApplied: (jobId) => get().appliedJobIds.includes(jobId),
    }),
    {
      name: 'jobreel-feed',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        savedJobs: state.savedJobs,
        appliedJobIds: state.appliedJobIds,
      }),
    }
  )
);
