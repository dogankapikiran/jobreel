// ─── Color math ──────────────────────────────────────────────────────────────

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s / 100) * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// ─── Palette types ────────────────────────────────────────────────────────────

export interface BrandPalette {
  cardBg: [string, string, string];
  gradient: [string, string];
  accent: string;
}

function paletteFromHue(hue: number, sat: number): BrandPalette {
  const s = Math.max(sat, 50);
  return {
    // start: dark tinted, mid: very dark tinted (not pure black), end: darker tinted
    cardBg:   [hslToHex(hue, Math.min(s, 55), 13), hslToHex(hue, Math.min(s, 28), 7), hslToHex(hue, Math.min(s, 42), 10)],
    gradient: [hslToHex(hue, Math.min(s + 10, 90), 48), hslToHex(hue, Math.min(s, 80), 65)],
    accent:    hslToHex(hue, Math.min(s + 5, 85), 58),
  };
}

/** Deterministic hash-based fallback (used until real color is extracted). */
export function brandColors(companyName: string | undefined | null): BrandPalette {
  const name = companyName || '';
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) + hash) ^ name.charCodeAt(i);
    hash = hash >>> 0;
  }
  return paletteFromHue(hash % 360, 70);
}

/** Build a palette from an extracted hex brand color. */
export function buildPaletteFromHex(hex: string): BrandPalette {
  const { h, s } = hexToHsl(hex);
  return paletteFromHue(h, s);
}

// ─── Color cache ──────────────────────────────────────────────────────────────

export const extractedColorCache = new Map<string, string>();

// ─── Domain / URL helpers ─────────────────────────────────────────────────────

export function guessCompanyDomain(companyName: string | undefined | null): string {
  const name = (companyName || '').trim();
  if (!name) return 'company.com';
  const tldMatch = name.toLowerCase().match(/^([\w-]+)\.(com|io|co|net|org|app|dev|ai|tech)\b/);
  if (tldMatch) return `${tldMatch[1]}.${tldMatch[2]}`;
  const word = name
    .toLowerCase()
    .replace(/\b(inc\.?|llc\.?|ltd\.?|limited|corp\.?|a\.?ş\.?|holding|group)\b/gi, '')
    .replace(/[,&+'"()!]/g, '')
    .trim()
    .split(/\s+/)[0]
    .replace(/[^a-z0-9-]/g, '');
  return `${word || 'company'}.com`;
}

export function clearbitLogoUrl(companyName: string | undefined | null): string {
  return `https://logo.clearbit.com/${guessCompanyDomain(companyName)}`;
}

export function faviconFallbackUrl(companyName: string | undefined | null): string {
  return `https://www.google.com/s2/favicons?domain=${guessCompanyDomain(companyName)}&sz=128`;
}

// ─── Vividness filter ─────────────────────────────────────────────────────────

function isVivid(r: number, g: number, b: number): boolean {
  const brightness = (r + g + b) / 3;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  return brightness < 230 && brightness > 20 && saturation >= 30;
}

// ─── PNG PLTE chunk extraction (indexed PNGs only, no decompression) ──────────

async function extractFromPngPalette(companyName: string | undefined | null): Promise<string | null> {
  try {
    const url = clearbitLogoUrl(companyName);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;

    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf[0] !== 137 || buf[1] !== 80) return null; // not PNG

    let offset = 8;
    while (offset + 12 <= buf.length) {
      const length = ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0;
      const type = String.fromCharCode(buf[offset + 4], buf[offset + 5], buf[offset + 6], buf[offset + 7]);

      if (type === 'PLTE') {
        for (let i = 0; i + 2 < length; i += 3) {
          const r = buf[offset + 8 + i];
          const g = buf[offset + 8 + i + 1];
          const b = buf[offset + 8 + i + 2];
          if (isVivid(r, g, b)) {
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          }
        }
        return null;
      }

      if (type === 'IDAT' || type === 'IEND') break;
      offset += 12 + length;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Website theme-color meta tag (most reliable brand color signal) ──────────

async function extractFromThemeColor(companyName: string | undefined | null): Promise<string | null> {
  try {
    const domain = guessCompanyDomain(companyName);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://${domain}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;

    const text = await res.text();
    // Match <meta name="theme-color" content="#rrggbb"> in any attribute order
    const m = text.match(/name=["']theme-color["'][^>]*content=["']\s*(#[0-9a-fA-F]{6})\b/i)
           ?? text.match(/content=["']\s*(#[0-9a-fA-F]{6})\s*["'][^>]*name=["']theme-color["']/i);
    if (!m) return null;

    const hex = m[1];
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return isVivid(r, g, b) ? hex : null;
  } catch {
    return null;
  }
}

// ─── Microlink palette API ────────────────────────────────────────────────────

async function extractFromMicrolink(companyName: string | undefined | null): Promise<string | null> {
  try {
    const domain = guessCompanyDomain(companyName);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://api.microlink.io?url=https://${domain}&palette=true`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return null;

    const json = await res.json();
    const palette: unknown = json?.data?.palette;
    if (!Array.isArray(palette)) return null;

    for (const hex of palette as string[]) {
      if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) continue;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      if (isVivid(r, g, b)) return hex;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function extractDominantColor(companyName: string | undefined | null): Promise<string | null> {
  const fromPng = await extractFromPngPalette(companyName);
  if (fromPng) return fromPng;

  const fromTheme = await extractFromThemeColor(companyName);
  if (fromTheme) return fromTheme;

  return extractFromMicrolink(companyName);
}
