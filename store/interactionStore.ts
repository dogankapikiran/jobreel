import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Interaction } from '@/types';
import { safeJSONStorage } from './safeStorage';
import { registerStoreCleanup } from './cleanupRegistry';

interface InteractionState {
  interactions: Interaction[];
  addInteraction: (interaction: Interaction) => void;
  reset: () => void;
}

export const useInteractionStore = create<InteractionState>()(
  persist(
    (set) => ({
      interactions: [],

      addInteraction: (interaction) =>
        set((state) => ({
          interactions: [interaction, ...state.interactions].slice(0, 500),
        })),

      reset: () => {
        AsyncStorage.removeItem('jobreel-interactions').catch(() => {});
        set({
          interactions: [],
        });
      },
    }),
    {
      name: 'jobreel-interactions',
      storage: safeJSONStorage,
    }
  )
);

registerStoreCleanup(() => useInteractionStore.getState().reset());
