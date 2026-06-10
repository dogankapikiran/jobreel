import { WorkType, Seniority } from '@/types';

export const WORK_TYPES: { value: WorkType | 'any'; label: string; icon: string }[] = [
  { value: 'any',    label: 'Farketmez', icon: '🔀' },
  { value: 'remote', label: 'Remote',    icon: '🌍' },
  { value: 'hybrid', label: 'Hibrit',    icon: '🏠' },
  { value: 'office', label: 'Ofis',      icon: '🏢' },
];

export const SENIORITY_OPTIONS: { value: Seniority; label: string; desc: string }[] = [
  { value: 'junior', label: 'Junior',        desc: '0–2 yıl' },
  { value: 'mid',    label: 'Mid-Level',     desc: '2–5 yıl' },
  { value: 'senior', label: 'Senior',        desc: '5–8 yıl' },
  { value: 'lead',   label: 'Lead/Principal', desc: '8+ yıl' },
];
