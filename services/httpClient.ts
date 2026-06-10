// services/httpClient.ts

import { supabase } from './supabase';
import { useAuthStore } from '@/store/authStore';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'https://api.jobreel.app/api';

export async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export type MiddlewareNext = (path: string, options: RequestInit) => Promise<Response>;
export type Middleware = (path: string, options: RequestInit, next: MiddlewareNext) => Promise<Response>;

// 1. Timeout Middleware
const timeoutMiddleware: Middleware = async (path, options, next) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout: ${path}`)), 30000);
  });
  try {
    const response = await Promise.race([next(path, options), timeoutPromise]);
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    return response;
  } catch (err) {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    throw err;
  }
};

// 2. Auth Header Middleware
const authMiddleware: Middleware = async (path, options, next) => {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };
  return next(path, { ...options, headers });
};

// 3. Error Handling Middleware
const errorMiddleware: Middleware = async (path, options, next) => {
  const res = await next(path, options);
  if (!res.ok) {
    if (res.status === 401) {
      const { session } = useAuthStore.getState();
      if (session) {
        useAuthStore.getState().signOut().catch(() => {});
      }
    }
    const body = await res.text().catch(() => '');
    if (__DEV__) console.warn(`[API] ${res.status} ${path}:`, body);
    throw new Error(`HTTP ${res.status}`);
  }
  return res;
};

// Pipeline executor order: outer-most (run first on request, last on response) to inner-most
const middlewares: Middleware[] = [
  errorMiddleware,     // intercepts HTTP status codes and handles 401s
  timeoutMiddleware,   // rejects slow requests
  authMiddleware,      // injects bearer token and default JSON headers
];

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let index = 0;
  
  const execute: MiddlewareNext = async (currentPath, currentOptions) => {
    if (index < middlewares.length) {
      const middleware = middlewares[index++];
      return middleware(currentPath, currentOptions, execute);
    }
    return fetch(`${BASE_URL}${currentPath}`, currentOptions);
  };
  
  const response = await execute(path, options);
  return response.json() as Promise<T>;
}
