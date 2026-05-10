import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

const _storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value == null) return null;
      JSON.parse(value); // validate before returning; throws if corrupt
      return value;
    } catch {
      await AsyncStorage.removeItem(key).catch(() => {});
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const safeJSONStorage = createJSONStorage(() => _storage);
