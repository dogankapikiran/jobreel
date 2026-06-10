import { create } from 'zustand';
import { Job } from '@/types';
import { registerStoreCleanup } from './cleanupRegistry';

interface FeedState {
  jobs: Job[];
  currentIndex: number;
  isLoading: boolean;

  setJobs: (jobs: Job[]) => void;
  appendJobs: (jobs: Job[]) => void;
  updateJobs: (jobs: Job[]) => void;
  setCurrentIndex: (index: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>()((set) => ({
  jobs: [],
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

  reset: () => {
    set({
      jobs: [],
      currentIndex: 0,
      isLoading: false,
    });
  },
}));

registerStoreCleanup(() => useFeedStore.getState().reset());
