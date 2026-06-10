// hooks/useJobAnalytics.ts

import { useCallback } from 'react';
import { track } from '@/services/analytics';
import { Job } from '@/types';

export function useJobAnalytics() {
  const trackJobSaved = useCallback((job: Job) => {
    track('Job Saved', {
      job_id: job.id,
      company: job.company,
      title: job.title,
      score: job.score,
    });
  }, []);

  const trackJobApplied = useCallback((job: Job) => {
    track('Job Applied', {
      job_id: job.id,
      company: job.company,
      title: job.title,
      score: job.score,
    });
  }, []);

  return { trackJobSaved, trackJobApplied };
}
