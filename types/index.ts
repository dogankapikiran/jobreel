export type WorkType = 'remote' | 'hybrid' | 'office' | 'unknown';
export type Seniority = 'junior' | 'mid' | 'senior' | 'lead' | 'unknown';
export type InteractionAction = 'view' | 'save' | 'apply' | 'skip';

export interface Job {
  id: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salaryPeriod: string;
  workType: WorkType;
  seniority: Seniority;
  sector: string;
  description: string;
  url: string;
  postedAt: string;
  companySize?: string;
  skills: string[];
  score?: number;
  accentIndex: number;
}

export interface UserPreferences {
  sectors: string[];
  seniority: Seniority;
  workType: WorkType | 'any';
  location: string;
  salaryMin: number;
  skills: string[];
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  graduationYear?: number;
}

export interface UserProfile {
  name: string;
  title: string;
  summary: string;
  location: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  preferences: UserPreferences;
}

export interface Interaction {
  jobId: string;
  action: InteractionAction;
  durationSeconds?: number;
  timestamp: number;
}

export interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
  category: { label: string };
  description: string;
  redirect_url: string;
  created: string;
}
