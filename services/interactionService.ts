import { Job } from '@/types';
import { request } from './httpClient';
import { mapJob } from './jobService';

export const interactionService = {
  postInteraction: (
    job_id: string,
    action: string,
    job?: {
      title?: string;
      company?: string;
      location?: string;
      sector?: string;
      workType?: string;
      seniority?: string;
      url?: string;
    }
  ) =>
    request<{ success: boolean }>('/interactions', {
      method: 'POST',
      body: JSON.stringify({
        job_id,
        action,
        job_title: job?.title,
        job_company: job?.company,
        job_location: job?.location,
        job_sector: job?.sector,
        job_work_type: job?.workType,
        job_seniority: job?.seniority,
        job_url: job?.url,
      }),
    }),

  getSaved: async (): Promise<Job[]> => {
    const data = await request<Record<string, unknown>[]>('/saved');
    return data.map(mapJob);
  },

  unsaveJob: (jobId: string) =>
    request<{ success: boolean }>(`/saved/${jobId}`, { method: 'DELETE' }),

  getApplications: async (): Promise<Job[]> => {
    const data = await request<Record<string, unknown>[]>('/applications');
    return data.map(mapJob);
  },
};
