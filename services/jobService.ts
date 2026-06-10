import { Job } from '@/types';
import { request } from './httpClient';

export interface CvParsed {
  name?: string;
  title?: string;
  skills?: string[];
  experience?: { company: string; role: string; years: number }[];
  education?: { school: string; degree: string }[];
  summary?: string;
}

export function mapJob(r: Record<string, unknown>, i: number): Job {
  // r may be a feed job (title, company, apply_url) or an interactions row (job_title, job_company, job_url)
  const id = (r.job_id as string) || (r.id as string);
  return {
    id,
    externalId: id,
    title: (r.title as string) || (r.job_title as string) || '',
    company: (r.company as string) || (r.job_company as string) || '',
    location: (r.location as string) || (r.job_location as string) || '',
    salaryMin: (r.salary_min as number) || undefined,
    salaryMax: (r.salary_max as number) || undefined,
    salaryCurrency: (r.salary_currency as string) || 'USD',
    salaryPeriod: 'year',
    workType: ((r.work_type || r.job_work_type) as Job['workType']) || 'unknown',
    employmentType: (r.employment_type as Job['employmentType']) || '',
    seniority: ((r.seniority || r.job_seniority) as Job['seniority']) || 'unknown',
    sector: (r.sector as string) || (r.job_sector as string) || '',
    companySize: (r.company_size as string) || undefined,
    description: (r.description as string) || '',
    url: (r.apply_url as string) || (r.job_url as string) || '',
    postedAt:
      (r.applied_at as string) ||
      (r.saved_at as string) ||
      (r.fetched_at as string) ||
      (r.created_at as string) ||
      new Date().toISOString(),
    skills: (r.tags as string[]) || [],
    score: typeof r.score === 'number' ? r.score : undefined,
    aiReason: (r.ai_reason as string) || undefined,
    matchedSkills: Array.isArray(r.matched_skills) ? (r.matched_skills as string[]) : undefined,
    missingSkills: Array.isArray(r.missing_skills) ? (r.missing_skills as string[]) : undefined,
    potentialScore: typeof r.potential_score === 'number' ? r.potential_score : undefined,
    accentIndex: i % 6,
  };
}

export const jobService = {
  feed: async (params?: {
    page?: number;
    location?: string;
    keyword?: string;
    sectors?: string;
    work_type?: string;
    seniority?: string;
  }): Promise<{ jobs: Job[]; total: number; partial: boolean }> => {
    const q = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined && v !== null && v !== '')
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : '';
    const data = await request<{ jobs: Record<string, unknown>[]; total: number; partial?: boolean }>(`/feed${q}`);
    return { jobs: data.jobs.map(mapJob), total: data.total, partial: data.partial ?? false };
  },

  getJobDescription: (jobId: string) =>
    request<{ description: string }>(`/job/${jobId}/description`),
};
