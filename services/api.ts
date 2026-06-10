import { jobService } from './jobService';
import { interactionService } from './interactionService';
import { profileService } from './profileService';
import { alertService } from './alertService';
import { companyService } from './companyService';

export { CvParsed, mapJob } from './jobService';
export { JobAlert } from './alertService';

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dakika önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export const api = {
  ...jobService,
  ...interactionService,
  ...profileService,
  ...alertService,
  ...companyService,
};
