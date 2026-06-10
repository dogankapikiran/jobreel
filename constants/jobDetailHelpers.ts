import { Linking } from 'react-native';

export function safeOpenURL(url: string): void {
  try {
    const { protocol } = new URL(url);
    if (protocol !== 'https:' && protocol !== 'http:') return;
    Linking.openURL(url).catch(() => {});
  } catch { /* geçersiz URL */ }
}

export type DescItem =
  | { kind: 'head'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'para'; text: string };

export function buildDescItems(rawDesc: string): DescItem[] {
  const clean = rawDesc
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*/g, '')
    .replace(/\\\-/g, '-')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const items: DescItem[] = [];

  for (const line of clean.split('\n').map((s) => s.trim()).filter(Boolean)) {
    // Explicit bullet or numbered marker
    if (/^[*•\-·]\s*\S/.test(line) || /^\d+[).]\s*\S/.test(line)) {
      const text = line
        .replace(/^[*•\-·]\s*/, '')
        .replace(/^\d+[).]\s*/, '')
        .trim();
      if (text.length >= 5) items.push({ kind: 'bullet', text });
      continue;
    }

    const wordCount = line.split(/\s+/).length;
    // Section heading: short, capital start, no terminal punctuation, no technical chars
    if (
      wordCount <= 5 &&
      line.length <= 55 &&
      /^[A-ZÇĞİÖŞÜ]/.test(line) &&
      !/[.!?]$/.test(line) &&
      !/[\d+\/%.@]/.test(line)
    ) {
      items.push({ kind: 'head', text: line });
      continue;
    }

    if (line.length >= 10) items.push({ kind: 'para', text: line });
  }

  return items;
}

export function workTypeLabel(wt: string): { icon: string; label: string } {
  switch (wt) {
    case 'remote':
      return { icon: '🌍', label: 'Remote' };
    case 'hybrid':
      return { icon: '🏠', label: 'Hibrit' };
    case 'office':
      return { icon: '🏢', label: 'Ofis' };
    default:
      return { icon: '📍', label: 'Belirtilmemiş' };
  }
}

export function employmentTypeLabel(et: string): string {
  switch (et) {
    case 'fulltime':
      return 'Tam Zamanlı';
    case 'parttime':
      return 'Part-time';
    case 'contract':
      return 'Sözleşmeli';
    case 'internship':
      return 'Staj';
    default:
      return '';
  }
}
