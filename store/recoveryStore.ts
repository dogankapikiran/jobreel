// store/recoveryStore.ts

import { create } from 'zustand';

interface RecoveryState {
  isRecoveryMode: boolean;
  setRecoveryMode: (value: boolean) => void;
}

export const useRecoveryStore = create<RecoveryState>()((set) => ({
  isRecoveryMode: false,
  setRecoveryMode: (value) => set({ isRecoveryMode: value }),
}));
