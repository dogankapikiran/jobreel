interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const MAX_CACHE_SIZE = 500;
const store = new Map<string, CacheEntry<unknown>>();

export const cache = {
  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    // LRU: mevcut anahtarı silerek sona taşı
    if (store.has(key)) store.delete(key);
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
    if (store.size > MAX_CACHE_SIZE) {
      // En eski (en az kullanılan) girdiyi sil
      const oldestKey = store.keys().next().value;
      if (oldestKey !== undefined) store.delete(oldestKey);
    }
  },

  get<T>(key: string): T | null {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    // LRU: erişilen girdiyi sona taşı
    store.delete(key);
    store.set(key, entry);
    return entry.data;
  },

  clear(): void {
    store.clear();
  },
};
