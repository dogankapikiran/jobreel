import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';
const API = 'https://api-eu.mixpanel.com';
const ANON_KEY = '@mp_anon_id';

if (__DEV__) console.log('[Analytics] Init:', TOKEN ? 'token mevcut' : 'TOKEN BOŞ!');

let distinctId = 'anonymous';
const pending: object[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function toBase64(str: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c < 2048) bytes.push(0xC0 | (c >> 6), 0x80 | (c & 63));
    else bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2];
    out += B64[a >> 2];
    out += B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += b !== undefined ? B64[((b & 15) << 2) | ((c ?? 0) >> 6)] : '=';
    out += c !== undefined ? B64[c & 63] : '=';
  }
  return out;
}

function generateSecureId(): string {
  try {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

async function getOrCreateAnonId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(ANON_KEY);
    if (stored) return stored;
    const id = generateSecureId();
    await AsyncStorage.setItem(ANON_KEY, id);
    return id;
  } catch {
    return generateSecureId();
  }
}

export async function initAnalytics(): Promise<void> {
  if (!TOKEN) return;
  distinctId = await getOrCreateAnonId();
  if (__DEV__) console.log('[Analytics] Init OK, distinctId:', distinctId);
}

export function identify(userId: string): void {
  if (!TOKEN) return;
  distinctId = userId;
  if (__DEV__) console.log('[Analytics] identify:', userId);
}

export function track(event: string, props: Record<string, unknown> = {}): void {
  if (!TOKEN) {
    if (__DEV__) console.warn('[Analytics] track çağrıldı ama TOKEN boş:', event);
    return;
  }
  if (__DEV__) console.log('[Analytics] track:', event, props);
  pending.push({
    event,
    properties: {
      token: TOKEN,
      distinct_id: distinctId,
      time: Math.floor(Date.now() / 1000),
      ...props,
    },
  });
  if (!timer) timer = setTimeout(flush, 1500);
}

async function flush(): Promise<void> {
  timer = null;
  if (!pending.length) return;
  const batch = pending.splice(0);
  try {
    const data = toBase64(JSON.stringify(batch));
    const url = `${API}/track?data=${encodeURIComponent(data)}&verbose=1`;
    if (__DEV__) console.log('[Analytics] flush ->', batch.length, 'event');
    const resp = await fetch(url, { method: 'GET' });
    const text = await resp.text();
    if (__DEV__) console.log('[Analytics] Mixpanel yanıt:', text);
  } catch (e) {
    if (__DEV__) console.error('[Analytics] fetch hatası:', e);
    pending.unshift(...batch);
  }
}
