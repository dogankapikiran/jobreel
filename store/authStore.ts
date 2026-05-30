import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { useFeedStore } from './feedStore';
import { useUserStore } from './userStore';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  isRecoveryMode: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setRecoveryMode: (value: boolean) => void;
}

async function clearUserStores() {
  useFeedStore.getState().reset();
  await useUserStore.getState().reset();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isLoading: true,
  error: null,
  isRecoveryMode: false,

  initialize: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      set({ session: data.session, isLoading: false });
    } catch {
      set({ session: null, isLoading: false });
    }
    supabase.auth.onAuthStateChange((_, newSession) => {
      const prevSession = get().session;
      if (prevSession?.user.id !== newSession?.user.id) {
        clearUserStores().catch(() => {});
      }
      set({ session: newSession });
    });
  },

  signIn: async (email, password) => {
    set({ error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { set({ error: error.message }); return false; }
    return true;
  },

  signUp: async (email, password) => {
    set({ error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('user already exists')) {
        set({ error: 'already_registered' });
      } else {
        set({ error: error.message });
      }
      return false;
    }
    // Email confirmation ON: Supabase returns empty identities for existing users
    if (data.user?.identities?.length === 0) {
      set({ error: 'already_registered' });
      return false;
    }
    return true;
  },

  signOut: async () => {
    await clearUserStores();
    await supabase.auth.signOut();
    set({ session: null });
  },

  clearError: () => set({ error: null }),
  setRecoveryMode: (value) => set({ isRecoveryMode: value }),
}));
