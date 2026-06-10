import { Linking } from 'react-native';
import { Job } from '@/types';

export function safeOpenURL(url: string): void {
  try {
    const { protocol } = new URL(url);
    if (protocol !== 'https:' && protocol !== 'http:') return;
    Linking.openURL(url).catch(() => {});
  } catch { /* geçersiz URL */ }
}

export function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function matchDotColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#84cc16';
  if (score >= 55) return '#f59e0b';
  return '#f97316';
}

export function workModeLabel(wt: Job['workType']): string {
  switch (wt) {
    case 'remote': return 'Uzaktan';
    case 'hybrid': return 'Hibrit';
    case 'office': return 'Ofis';
    default: return '';
  }
}

export function dateBucket(ts: number | undefined): string {
  if (!ts) return 'Daha Önce';
  const days = (Date.now() - ts) / 86_400_000;
  if (days < 1) return 'Bugün';
  if (days < 2) return 'Dün';
  const d = Math.floor(days);
  if (d < 7) return `${d} Gün Önce`;
  if (d < 14) return '1 Hafta Önce';
  return 'Daha Önce';
}

export const BUCKET_ORDER = [
  'Bugün', 'Dün',
  '2 Gün Önce', '3 Gün Önce', '4 Gün Önce', '5 Gün Önce', '6 Gün Önce',
  '1 Hafta Önce', 'Daha Önce',
];

export type FilterKey = 'Tümü' | 'Hibrit' | 'Uzaktan' | 'Bu hafta';
export const FILTERS: FilterKey[] = ['Tümü', 'Hibrit', 'Uzaktan', 'Bu hafta'];

export function filterJobs(
  jobs: Job[],
  filter: FilterKey,
  timestamps: Record<string, number>,
): Job[] {
  switch (filter) {
    case 'Hibrit':   return jobs.filter(j => j.workType === 'hybrid');
    case 'Uzaktan':  return jobs.filter(j => j.workType === 'remote');
    case 'Bu hafta': {
      const weekAgo = Date.now() - 7 * 86_400_000;
      return jobs.filter(j => (timestamps[j.id] ?? 0) > weekAgo);
    }
    default: return jobs;
  }
}
