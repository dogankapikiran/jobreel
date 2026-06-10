// utils/jobLabels.ts

import { EmploymentType, Job, Seniority } from '@/types';

export function workTypeShort(wt: Job['workType']): string {
  switch (wt) {
    case 'remote': return 'Uzaktan';
    case 'hybrid': return 'Hibrit';
    case 'office': return 'Ofis';
    default:       return '';
  }
}

export function seniorityLabel(s: Seniority): string {
  switch (s) {
    case 'junior': return 'Junior';
    case 'mid':    return 'Mid';
    case 'senior': return 'Senior';
    case 'lead':   return 'Lead';
    default:       return '';
  }
}

export function employmentShort(e: EmploymentType): string {
  switch (e) {
    case 'fulltime':   return 'Tam Zamanlı';
    case 'parttime':   return 'Yarı Zamanlı';
    case 'contract':   return 'Sözleşmeli';
    case 'internship': return 'Staj';
    default:           return '';
  }
}
