import { supabase } from './supabase';
import { Job } from '@/types';

const BASE_URL = 'http://92.5.94.187/api';

function mapJob(r: Record<string, unknown>, i: number): Job {
  return {
    id: r.id as string,
    externalId: r.id as string,
    title: r.title as string,
    company: r.company as string,
    location: (r.location as string) || '',
    salaryMin: (r.salary_min as number) || undefined,
    salaryMax: (r.salary_max as number) || undefined,
    salaryCurrency: 'TRY',
    salaryPeriod: 'year',
    workType: (r.work_type as Job['workType']) || 'unknown',
    seniority: 'unknown',
    sector: '',
    description: (r.description as string) || '',
    url: (r.apply_url as string) || '',
    postedAt:
      (r.applied_at as string) ||
      (r.saved_at as string) ||
      (r.fetched_at as string) ||
      new Date().toISOString(),
    skills: (r.tags as string[]) || [],
    accentIndex: i % 6,
  };
}

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  feed: async (params?: { page?: number; location?: string }): Promise<{ jobs: Job[]; total: number }> => {
    const q = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    const data = await request<{ jobs: Record<string, unknown>[]; total: number }>(`/feed${q}`);
    return { jobs: data.jobs.map(mapJob), total: data.total };
  },

  getProfile: () => request<Record<string, unknown>>('/profile'),

  updateProfile: (data: Record<string, unknown>) =>
    request<{ success: boolean }>('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  postInteraction: (job_id: string, action: string) =>
    request<{ success: boolean }>('/interactions', {
      method: 'POST',
      body: JSON.stringify({ job_id, action }),
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
