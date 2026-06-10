import { request } from './httpClient';

export const companyService = {
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
