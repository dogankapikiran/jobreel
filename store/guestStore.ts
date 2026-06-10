// store/guestStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeJSONStorage } from './safeStorage';

interface GuestState {
  isGuest: boolean;
  setGuest: (value: boolean) => void;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      isGuest: false,
      setGuest: (value) => set({ isGuest: value }),
    }),
    {
      name: 'jobreel-guest',
      storage: safeJSONStorage,
    }
  )
);
