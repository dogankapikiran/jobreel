// hooks/useJobCardActions.ts

import { useCallback } from 'react';
import { router } from 'expo-router';
import { Job } from '@/types';
import { useInteractionStore } from '@/store/interactionStore';
import { api } from '@/services/api';
import { track } from '@/services/analytics';

import { useSaveJob } from './useSaveJob';
import { useApplyJob } from './useApplyJob';
import { useFollowCompany } from './useFollowCompany';
import { useShareJob } from './useShareJob';

export function useJobCardActions(job: Job) {
  const { saved, handleSave } = useSaveJob(job);
  const { applied, handleApply, cleanup } = useApplyJob(job);
  const { followed, handleToggleFollow } = useFollowCompany(job.company);
  const { handleShare } = useShareJob(job);
  const { addInteraction } = useInteractionStore();

  const handleExplore = useCallback(() => {
    addInteraction({ jobId: job.id, action: 'view', timestamp: Date.now() });
    api.postInteraction(job.id, 'view', job).catch(() => {});
    track('Job Detail Viewed', { job_id: job.id, company: job.company, title: job.title, score: job.score });
    router.push(`/job/${job.id}`);
  }, [job, addInteraction]);

  return {
    saved,
    applied,
    followed,
    handleSave,
    handleShare,
    handleApply,
    handleExplore,
    handleToggleFollow,
    cleanup,
  };
}
