import { request } from './httpClient';

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

export const alertService = {
  getAlerts: () => request<JobAlert[]>('/alerts'),

  createAlert: (alert: Omit<JobAlert, 'id' | 'created_at' | 'enabled'>) =>
    request<JobAlert>('/alerts', { method: 'POST', body: JSON.stringify(alert) }),

  toggleAlert: (id: string, enabled: boolean) =>
    request<{ success: boolean }>(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),

  updateAlert: (id: string, data: Partial<Omit<JobAlert, 'id' | 'created_at'>>) =>
    request<JobAlert>(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteAlert: (id: string) =>
    request<{ success: boolean }>(`/alerts/${id}`, { method: 'DELETE' }),
};
