import { supabase } from './supabase';

export type { Session, AuthError, User } from '@supabase/supabase-js';

export const authService = {
  getSession: () =>
    supabase.auth.getSession(),

  onAuthStateChange: (
    callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
  ) =>
    supabase.auth.onAuthStateChange(callback),

  signInWithPassword: (credentials: { email: string; password: string }) =>
    supabase.auth.signInWithPassword(credentials),

  signUp: (credentials: { email: string; password: string }) =>
    supabase.auth.signUp(credentials),

  signOut: () =>
    supabase.auth.signOut(),

  signInWithIdToken: (params: { provider: 'apple' | 'google'; token: string }) =>
    supabase.auth.signInWithIdToken(params),

  signInWithOAuth: (
    params: Parameters<typeof supabase.auth.signInWithOAuth>[0]
  ) =>
    supabase.auth.signInWithOAuth(params),

  setSession: (params: { access_token: string; refresh_token: string }) =>
    supabase.auth.setSession(params),

  resetPasswordForEmail: (email: string, options?: { redirectTo?: string }) =>
    supabase.auth.resetPasswordForEmail(email, options),

  updateUser: (params: { password?: string }) =>
    supabase.auth.updateUser(params),

  deleteAccount: () =>
    supabase.rpc('delete_user'),
};
