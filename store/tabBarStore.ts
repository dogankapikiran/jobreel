import { create } from 'zustand';

interface TabBarStore {
  visible: boolean;
  setVisible: (v: boolean) => void;
}

export const useTabBarStore = create<TabBarStore>((set) => ({
  visible: true,
  setVisible: (visible) => set({ visible }),
}));
