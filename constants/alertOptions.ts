import { JobAlert } from '@/services/api';

export const WT_OPTIONS = [
  { value: 'any',    label: 'Farketmez' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hibrit' },
  { value: 'office', label: 'Ofis' },
];

export const SN_OPTIONS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid',    label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead',   label: 'Lead' },
];

export const TOP_SECTORS = [
  'Yazılım & Teknoloji', 'Yapay Zeka & ML', 'Fintech & Bankacılık',
  'E-ticaret', 'SaaS & B2B', 'Reklam & Pazarlama',
  'Veri & Analitik', 'İnsan Kaynakları & HR Tech', 'Sağlık & Biyoteknoloji',
  'Eğitim & EdTech', 'Gaming & Oyun', 'Muhasebe & Finans',
];

export const WT_LABELS: Record<string, string> = {
  any: 'Farketmez', remote: 'Remote', hybrid: 'Hibrit', office: 'Ofis',
};

export const SN_LABELS: Record<string, string> = {
  junior: 'Junior', mid: 'Mid-Level', senior: 'Senior', lead: 'Lead',
};

export const DEFAULT_FORM = {
  keyword: '',
  location: 'Istanbul, Turkey',
  work_type: 'any',
  seniority: [] as string[],
  sectors: [] as string[],
};

export function normalizeLocationDisplay(loc: string): string {
  return (loc || 'İstanbul')
    .replace(', Turkey', '')
    .replace(', Türkiye', '')
    .replace(/^Istanbul$/, 'İstanbul')
    .replace(/^Izmir$/, 'İzmir')
    .trim();
}

export function alertLabel(a: JobAlert): string {
  if (a.label) return a.label;
  const parts: string[] = [];
  if (a.keyword) parts.push(a.keyword);
  if (a.work_type && a.work_type !== 'any') parts.push(WT_LABELS[a.work_type] ?? a.work_type);
  if (a.seniority?.length) parts.push(a.seniority.map((s) => SN_LABELS[s] ?? s).join(', '));
  return parts.join(' · ') || 'Genel Arama';
}

export function alertSub(a: JobAlert): string {
  const parts: string[] = [];
  const loc = normalizeLocationDisplay(a.location);
  if (loc) parts.push(loc);
  if (a.sectors?.length) parts.push(a.sectors.slice(0, 2).join(', '));
  return parts.join(' · ') || 'İstanbul';
}

export function normalizeLocationForSave(loc: string): string {
  const clean = (loc || '').trim();
  const map: Record<string, string> = {
    'İstanbul': 'Istanbul, Turkey', 'istanbul': 'Istanbul, Turkey',
    'Ankara': 'Ankara, Turkey', 'ankara': 'Ankara, Turkey',
    'İzmir': 'Izmir, Turkey', 'izmir': 'Izmir, Turkey',
    'Bursa': 'Bursa, Turkey', 'bursa': 'Bursa, Turkey',
    'Antalya': 'Antalya, Turkey', 'antalya': 'Antalya, Turkey',
    'Remote': 'Remote', 'remote': 'Remote', 'Uzaktan': 'Remote',
  };
  if (map[clean]) return map[clean];
  if (!clean) return 'Istanbul, Turkey';
  return clean.includes(', Turkey') || clean.toLowerCase() === 'remote' ? clean : `${clean}, Turkey`;
}
