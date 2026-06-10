// hooks/useSaveJob.ts

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useSavedStore } from '@/store/savedStore';
import { useInteractionStore } from '@/store/interactionStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { useJobAnalytics } from './useJobAnalytics';
import { Job } from '@/types';

export function useSaveJob(job: Job) {
  const { saveJob, unsaveJob, isSaved } = useSavedStore();
  const { addInteraction } = useInteractionStore();
  const { trackJobSaved } = useJobAnalytics();
  const saved = isSaved(job.id);

  const handleSave = useCallback(() => {
    const session = useAuthStore.getState().session;
    if (!session) {
      Alert.alert(
        'Giriş Gerekli',
        'İlanları kaydedebilmek için lütfen giriş yapın.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Giriş Yap', onPress: () => router.push('/auth') },
        ]
      );
      return;
    }
    if (saved) {
      unsaveJob(job.id);
      addInteraction({ jobId: job.id, action: 'unsave', timestamp: Date.now() });
      api.unsaveJob(job.id).catch(() => { saveJob(job); });
      api.postInteraction(job.id, 'unsave', job).catch(() => {});
    } else {
      saveJob(job);
      addInteraction({ jobId: job.id, action: 'save', timestamp: Date.now() });
      api.postInteraction(job.id, 'save', job).catch(() => { unsaveJob(job.id); });
      trackJobSaved(job);
    }
  }, [saved, job, saveJob, unsaveJob, addInteraction, trackJobSaved]);

  return { saved, handleSave };
}
