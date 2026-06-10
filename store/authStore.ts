import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { authService } from '@/services/authService';
import { runStoreCleanups } from './cleanupRegistry';
import { useGuestStore } from './guestStore';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  session: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const { data } = await authService.getSession();
      set({ session: data.session, isLoading: false });
      if (data.session) {
        useGuestStore.getState().setGuest(false);
      }
    } catch {
      set({ session: null, isLoading: false });
    }
    authService.onAuthStateChange((_, newSession) => {
      const prevSession = get().session;
      if (prevSession?.user.id !== newSession?.user.id) {
        runStoreCleanups().catch(() => {});
      }
      if (newSession) {
        set({ session: newSession });
        useGuestStore.getState().setGuest(false);
      } else {
        set({ session: newSession });
      }
    });
  },

  signIn: async (email, password) => {
    set({ error: null });
    const { error } = await authService.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message });
      return false;
    }
    useGuestStore.getState().setGuest(false);
    return true;
  },

  signUp: async (email, password) => {
    set({ error: null });
    const { data, error } = await authService.signUp({ email, password });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('user already exists')) {
        set({ error: 'already_registered' });
      } else {
        set({ error: error.message });
      }
      return false;
    }
    if (data.user?.identities?.length === 0) {
      set({ error: 'already_registered' });
      return false;
    }
    useGuestStore.getState().setGuest(false);
    return true;
  },

  signOut: async () => {
    await runStoreCleanups();
    await authService.signOut();
    set({ session: null });
    useGuestStore.getState().setGuest(false);
  },

  clearError: () => set({ error: null }),
}));
