// hooks/useShareJob.ts

import { useCallback } from 'react';
import { Share } from 'react-native';
import { Job } from '@/types';

export function useShareJob(job: Job) {
  const handleShare = useCallback(() => {
    Share.share({ message: `${job.title} – ${job.company}\n${job.url}` });
  }, [job]);

  return { handleShare };
}
