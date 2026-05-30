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

// ─── Palette types ────────────────────────────────────────────────────────────

export interface BrandPalette {
  cardBg: [string, string, string];
  gradient: [string, string];
  accent: string;
}

function paletteFromHue(hue: number, sat: number): BrandPalette {
  const s = Math.max(sat, 50);
  return {
    cardBg:   [hslToHex(hue, Math.min(s, 55), 13), hslToHex(hue, Math.min(s, 28), 7), hslToHex(hue, Math.min(s, 42), 10)],
    gradient: [hslToHex(hue, Math.min(s + 10, 90), 48), hslToHex(hue, Math.min(s, 80), 65)],
    accent:    hslToHex(hue, Math.min(s + 5, 85), 58),
  };
}

/** Deterministic hash-based palette (used by applications/saved screens). */
export function brandColors(companyName: string | undefined | null): BrandPalette {
  const name = companyName || '';
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) + hash) ^ name.charCodeAt(i);
    hash = hash >>> 0;
  }
  return paletteFromHue(hash % 360, 70);
}

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
