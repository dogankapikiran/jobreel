interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export const cache = {
  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
  },

  get<T>(key: string): T | null {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.data;
  },

  clear(): void {
    store.clear();
  },
};
