import { supabase } from './supabase';
import { Job } from '@/types';

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} dakika önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'https://api.jobreel.app/api';

function mapJob(r: Record<string, unknown>, i: number): Job {
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
    matchedSkills: (r.matched_skills as string[]) || undefined,
    missingSkills: (r.missing_skills as string[]) || undefined,
    potentialScore: typeof r.potential_score === 'number' ? r.potential_score : undefined,
    accentIndex: i % 6,
  };
}

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout: ${path}`)), 30000)
  );
  const fetchPromise = fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });
  const res = await Promise.race([fetchPromise, timeout]);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  feed: async (params?: {
    page?: number;
    location?: string;
    keyword?: string;
    sectors?: string;
    work_type?: string;
    seniority?: string;
  }): Promise<{ jobs: Job[]; total: number; partial: boolean }> => {
    const q = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    const data = await request<{ jobs: Record<string, unknown>[]; total: number; partial?: boolean }>(`/feed${q}`);
    return { jobs: data.jobs.map(mapJob), total: data.total, partial: data.partial ?? false };
  },

  getProfile: () => request<Record<string, unknown>>('/profile'),

  updateProfile: (data: Record<string, unknown>) =>
    request<{ success: boolean }>('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  postInteraction: (job_id: string, action: string, job?: { title?: string; company?: string; location?: string; sector?: string; workType?: string; seniority?: string; url?: string }) =>
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

  getAvatarUploadUrl: (ext: string) =>
    request<{ signedUrl: string; token: string; path: string; publicUrl: string }>(
      '/profile/avatar-url',
      { method: 'POST', body: JSON.stringify({ ext }) }
    ),

  getJobDescription: (jobId: string) =>
    request<{ description: string }>(`/job/${jobId}/description`),

  connectLinkedIn: (code: string) =>
    request<{ success: boolean; name: string; headline: string; photo_url: string }>(
      '/linkedin/connect',
      { method: 'POST', body: JSON.stringify({ code }) }
    ),

  disconnectLinkedIn: () =>
    request<{ success: boolean }>('/linkedin/connect', { method: 'DELETE' }),

  savePushToken: (token: string) =>
    request<{ success: boolean }>('/profile/push-token', {
      method: 'PUT',
      body: JSON.stringify({ token }),
    }),

  getAlerts: () => request<JobAlert[]>('/alerts'),

  createAlert: (alert: Omit<JobAlert, 'id' | 'created_at' | 'enabled'>) =>
    request<JobAlert>('/alerts', { method: 'POST', body: JSON.stringify(alert) }),

  toggleAlert: (id: string, enabled: boolean) =>
    request<{ success: boolean }>(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),

  deleteAlert: (id: string) =>
    request<{ success: boolean }>(`/alerts/${id}`, { method: 'DELETE' }),

  getCvUploadUrl: () =>
    request<{ signedUrl: string; path: string }>('/profile/cv-url', { method: 'POST', body: '{}' }),

  getCvSignedUrl: () =>
    request<{ signedUrl: string }>('/profile/cv-signed-url'),

  parseCv: () =>
    request<{ success: boolean; parsed: CvParsed }>('/profile/cv-parse', { method: 'POST', body: '{}' }),

  getFollowedCompanies: () =>
    request<string[]>('/companies/following'),

  followCompany: (company_name: string) =>
    request<{ success: boolean }>('/companies/follow', {
      method: 'POST',
      body: JSON.stringify({ company_name }),
    }),

  unfollowCompany: (company_name: string) =>
    request<{ success: boolean }>(`/companies/follow/${encodeURIComponent(company_name)}`, {
      method: 'DELETE',
    }),
};

export interface CvParsed {
  name?: string;
  title?: string;
  skills?: string[];
  experience?: { company: string; role: string; years: number }[];
  education?: { school: string; degree: string }[];
  summary?: string;
}

export interface JobAlert {
  id: string;
  user_id?: string;
  label: string;
  keyword: string;
  location: string;
  work_type: string;
  seniority: string[];
  sectors: string[];
  enabled: boolean;
  created_at?: string;
}
