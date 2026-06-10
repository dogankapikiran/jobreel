import { request } from './httpClient';
import type { CvParsed } from './jobService';

export const profileService = {
  getProfile: () => request<Record<string, unknown>>('/profile'),

  updateProfile: (data: Record<string, unknown>) =>
    request<{ success: boolean }>('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  getAvatarUploadUrl: (ext: string) =>
    request<{ signedUrl: string; token: string; path: string; publicUrl: string }>(
      '/profile/avatar-url',
      { method: 'POST', body: JSON.stringify({ ext }) }
    ),

  savePushToken: (token: string) =>
    request<{ success: boolean }>('/profile/push-token', {
      method: 'PUT',
      body: JSON.stringify({ token }),
    }),

  getCvUploadUrl: () =>
    request<{ signedUrl: string; path: string }>('/profile/cv-url', { method: 'POST', body: '{}' }),

  getCvSignedUrl: () =>
    request<{ signedUrl: string }>('/profile/cv-signed-url'),

  parseCv: () =>
    request<{ success: boolean; parsed: CvParsed }>('/profile/cv-parse', { method: 'POST', body: '{}' }),

  updateNotifPrefs: (prefs: { notif_follow?: boolean; notif_job_alerts?: boolean }) =>
    request<{ success: boolean }>('/profile/notif-prefs', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    }),

  logError: (error: string, stack?: string, userInfo?: Record<string, unknown>, deviceInfo?: Record<string, unknown>) =>
    request<{ success: boolean }>('/log/error', {
      method: 'POST',
      body: JSON.stringify({ error, stack, userInfo, deviceInfo }),
    }),
};
