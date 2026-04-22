import { AdzunaJob, Job, Seniority, WorkType } from '@/types';
import { GRADIENTS } from '@/constants/theme';
import { cache } from './cache';

const APP_ID = process.env.EXPO_PUBLIC_ADZUNA_APP_ID ?? '';
const APP_KEY = process.env.EXPO_PUBLIC_ADZUNA_APP_KEY ?? '';
const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/tr/search';

function inferWorkType(text: string): WorkType {
  const t = text.toLowerCase();
  if (t.includes('remote') || t.includes('uzaktan') || t.includes('uzak')) return 'remote';
  if (t.includes('hybrid') || t.includes('hibrit')) return 'hybrid';
  if (t.includes('office') || t.includes('ofis') || t.includes('yerinde')) return 'office';
  return 'unknown';
}

function inferSeniority(title: string): Seniority {
  const t = title.toLowerCase();
  if (t.includes('lead') || t.includes('principal') || t.includes('staff')) return 'lead';
  if (t.includes('senior') || t.includes('sr.') || t.includes('sr ')) return 'senior';
  if (t.includes('junior') || t.includes('jr.') || t.includes('jr ') || t.includes('entry')) return 'junior';
  return 'mid';
}

function mapAdzunaJob(raw: AdzunaJob, index: number): Job {
  return {
    id: `adzuna_${raw.id}`,
    externalId: raw.id,
    title: raw.title,
    company: raw.company.display_name,
    location: raw.location.display_name,
    salaryMin: raw.salary_min,
    salaryMax: raw.salary_max,
    salaryCurrency: '₺',
    salaryPeriod: 'ay',
    workType: inferWorkType(`${raw.title} ${raw.description}`),
    seniority: inferSeniority(raw.title),
    sector: raw.category.label,
    description: raw.description,
    url: raw.redirect_url,
    postedAt: raw.created,
    skills: [],
    accentIndex: index % GRADIENTS.length,
  };
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} dakika önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export interface FetchJobsParams {
  what?: string;
  where?: string;
  page?: number;
  resultsPerPage?: number;
  salaryMin?: number;
  fullTime?: boolean;
}

export async function fetchJobs(params: FetchJobsParams): Promise<Job[]> {
  const cacheKey = JSON.stringify(params);
  const cached = cache.get<Job[]>(cacheKey);
  if (cached) return cached;

  if (!APP_ID || !APP_KEY) {
    return getMockJobs();
  }

  try {
    const url = new URL(`${BASE_URL}/${params.page ?? 1}`);
    url.searchParams.set('app_id', APP_ID);
    url.searchParams.set('app_key', APP_KEY);
    url.searchParams.set('results_per_page', String(params.resultsPerPage ?? 10));
    if (params.what) url.searchParams.set('what', params.what);
    if (params.where) url.searchParams.set('where', params.where);
    if (params.salaryMin) url.searchParams.set('salary_min', String(params.salaryMin));
    if (params.fullTime) url.searchParams.set('full_time', '1');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Adzuna API error: ${response.status}`);

    const data = await response.json();
    const jobs = (data.results as AdzunaJob[]).map((j, i) => mapAdzunaJob(j, i));

    cache.set(cacheKey, jobs, 10 * 60 * 1000);
    return jobs;
  } catch {
    return getMockJobs();
  }
}

export function getMockJobs(): Job[] {
  return [
    {
      id: 'mock_1',
      externalId: 'mock_1',
      title: 'Senior Product Designer',
      company: 'Notion',
      location: 'San Francisco',
      salaryMin: 120000,
      salaryMax: 160000,
      salaryCurrency: '$',
      salaryPeriod: 'yıl',
      workType: 'remote',
      seniority: 'senior',
      sector: 'Technology',
      description: 'We are looking for a Senior Product Designer to join our Design Systems team. You will work closely with engineering and product teams to define and evolve our design language, create intuitive user experiences, and ensure consistency across all Notion products.',
      url: 'https://notion.so/careers',
      postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      companySize: '400+',
      skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
      accentIndex: 0,
    },
    {
      id: 'mock_2',
      externalId: 'mock_2',
      title: 'Lead Frontend Engineer',
      company: 'Trendyol',
      location: 'İstanbul',
      salaryMin: 180000,
      salaryMax: 240000,
      salaryCurrency: '₺',
      salaryPeriod: 'ay',
      workType: 'hybrid',
      seniority: 'lead',
      sector: 'E-commerce',
      description: 'Trendyol bünyesinde React Native ve Web platformunda çalışacak Lead Frontend Engineer arıyoruz. Yüksek trafikli sistemlerde performans optimizasyonu ve teknik liderlik deneyimi aranmaktadır.',
      url: 'https://trendyol.com/careers',
      postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      companySize: '5000+',
      skills: ['React Native', 'TypeScript', 'Node.js', 'GraphQL'],
      accentIndex: 1,
    },
    {
      id: 'mock_3',
      externalId: 'mock_3',
      title: 'Backend Engineer',
      company: 'Getir',
      location: 'İstanbul',
      salaryMin: 120000,
      salaryMax: 160000,
      salaryCurrency: '₺',
      salaryPeriod: 'ay',
      workType: 'hybrid',
      seniority: 'mid',
      sector: 'Delivery & Logistics',
      description: "Getir'in hızla büyüyen backend ekibine katılacak deneyimli bir mühendis arıyoruz. Yüksek ölçekli sistemlerde Node.js ve PostgreSQL deneyimi olan adayları bekliyoruz.",
      url: 'https://getir.com/careers',
      postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      companySize: '10000+',
      skills: ['Node.js', 'PostgreSQL', 'Redis', 'Docker'],
      accentIndex: 2,
    },
    {
      id: 'mock_4',
      externalId: 'mock_4',
      title: 'iOS Developer',
      company: 'Hepsiburada',
      location: 'İstanbul',
      salaryMin: 100000,
      salaryMax: 140000,
      salaryCurrency: '₺',
      salaryPeriod: 'ay',
      workType: 'hybrid',
      seniority: 'mid',
      sector: 'E-commerce',
      description: 'Hepsiburada iOS ekibine katılacak tutkulu bir developer arıyoruz. Swift ve SwiftUI konusunda güçlü geçmişe sahip adayları bekliyoruz.',
      url: 'https://hepsiburada.com/careers',
      postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      companySize: '3000+',
      skills: ['Swift', 'UIKit', 'SwiftUI', 'Core Data'],
      accentIndex: 3,
    },
    {
      id: 'mock_5',
      externalId: 'mock_5',
      title: 'Full Stack Developer',
      company: 'Insider',
      location: 'İstanbul',
      salaryMin: 90000,
      salaryMax: 130000,
      salaryCurrency: '₺',
      salaryPeriod: 'ay',
      workType: 'remote',
      seniority: 'mid',
      sector: 'SaaS',
      description: "Insider'ın global SaaS platformunda çalışacak Full Stack Developer arıyoruz. React ve Python konusunda deneyimli, AWS mimarisini bilen adaylar tercih edilir.",
      url: 'https://useinsider.com/careers',
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      companySize: '1000+',
      skills: ['React', 'Node.js', 'Python', 'AWS'],
      accentIndex: 4,
    },
    {
      id: 'mock_6',
      externalId: 'mock_6',
      title: 'Data Scientist',
      company: 'Peak Games',
      location: 'İstanbul',
      salaryMin: 110000,
      salaryMax: 150000,
      salaryCurrency: '₺',
      salaryPeriod: 'ay',
      workType: 'hybrid',
      seniority: 'senior',
      sector: 'Gaming',
      description: 'Peak Games veri bilimi ekibine katılacak deneyimli bir Data Scientist arıyoruz. Oyun davranış analizi ve makine öğrenmesi modelleri üzerinde çalışacaksınız.',
      url: 'https://peakgames.com/careers',
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      companySize: '500+',
      skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
      accentIndex: 5,
    },
    {
      id: 'mock_7',
      externalId: 'mock_7',
      title: 'DevOps Engineer',
      company: 'Odeabank',
      location: 'İstanbul',
      salaryMin: 130000,
      salaryMax: 170000,
      salaryCurrency: '₺',
      salaryPeriod: 'ay',
      workType: 'office',
      seniority: 'senior',
      sector: 'Banking & Finance',
      description: 'Odeabank DevOps ekibine katılacak Kubernetes ve Terraform konusunda uzman bir mühendis arıyoruz. CI/CD pipeline yönetimi ve cloud altyapısı deneyimi gerekmektedir.',
      url: 'https://odeabank.com/careers',
      postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      companySize: '2000+',
      skills: ['Kubernetes', 'Docker', 'Terraform', 'CI/CD'],
      accentIndex: 0,
    },
    {
      id: 'mock_8',
      externalId: 'mock_8',
      title: 'UX Researcher',
      company: 'Yemeksepeti',
      location: 'İstanbul',
      salaryMin: 80000,
      salaryMax: 110000,
      salaryCurrency: '₺',
      salaryPeriod: 'ay',
      workType: 'hybrid',
      seniority: 'mid',
      sector: 'Food & Delivery',
      description: 'Yemeksepeti ürün ekibine katılacak bir UX Researcher arıyoruz. Kullanıcı araştırması, kullanılabilirlik testi ve veri analizi konularında deneyim gerekmektedir.',
      url: 'https://yemeksepeti.com/careers',
      postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      companySize: '2500+',
      skills: ['User Research', 'Usability Testing', 'Figma', 'Analytics'],
      accentIndex: 1,
    },
    {
      id: 'mock_9',
      externalId: 'mock_9',
      title: 'Mobile Developer',
      company: 'Papara',
      location: 'İstanbul',
      salaryMin: 100000,
      salaryMax: 140000,
      salaryCurrency: '₺',
      salaryPeriod: 'ay',
      workType: 'hybrid',
      seniority: 'mid',
      sector: 'Fintech',
      description: "Papara'nın büyüyen mobile ekibine katılacak bir React Native developer arıyoruz. Finansal uygulamalar ve güvenlik konusunda deneyim büyük avantajdır.",
      url: 'https://papara.com/careers',
      postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      companySize: '800+',
      skills: ['React Native', 'TypeScript', 'REST APIs', 'Security'],
      accentIndex: 2,
    },
    {
      id: 'mock_10',
      externalId: 'mock_10',
      title: 'Product Manager',
      company: 'Garanti BBVA',
      location: 'İstanbul',
      salaryMin: 150000,
      salaryMax: 200000,
      salaryCurrency: '₺',
      salaryPeriod: 'ay',
      workType: 'hybrid',
      seniority: 'senior',
      sector: 'Banking & Finance',
      description: 'Garanti BBVA dijital ürün ekibine katılacak deneyimli bir Product Manager arıyoruz. Fintech ürünleri ve agile metodolojisi konusunda derin bilgiye sahip olmanız gerekmektedir.',
      url: 'https://garantibbva.com.tr/careers',
      postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      companySize: '15000+',
      skills: ['Product Strategy', 'Agile', 'Data Analysis', 'Roadmapping'],
      accentIndex: 3,
    },
  ];
}
