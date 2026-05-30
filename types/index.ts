export type WorkType = 'remote' | 'hybrid' | 'office' | 'unknown';
export type Seniority = 'junior' | 'mid' | 'senior' | 'lead' | 'unknown';
export type EmploymentType = 'fulltime' | 'parttime' | 'contract' | 'internship' | '';
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
  employmentType: EmploymentType;
  seniority: Seniority;
  sector: string;
  description: string;
  url: string;
  postedAt: string;
  companySize?: string;
  skills: string[];
  score?: number;
  aiReason?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  potentialScore?: number;
  accentIndex: number;
  isClosed?: boolean;
}

export interface UserPreferences {
  sectors: string[];
  seniority: Seniority[];
  workType: WorkType | 'any';
  workTypes?: WorkType[];
  location: string;
  cities?: string[];
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
  avatarUrl?: string;
  linkedInConnected?: boolean;
  linkedInName?: string;
  linkedInHeadline?: string;
  linkedInPhotoUrl?: string;
}

export interface Interaction {
  jobId: string;
  action: InteractionAction;
  durationSeconds?: number;
  timestamp: number;
}
