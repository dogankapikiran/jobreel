// hooks/useApplyJob.ts

import { useCallback, useRef } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import { useApplicationStore } from '@/store/applicationStore';
import { useInteractionStore } from '@/store/interactionStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { useJobAnalytics } from './useJobAnalytics';
import { Job } from '@/types';

function safeOpenURL(url: string): void {
  try {
    const { protocol } = new URL(url);
    if (protocol !== 'https:' && protocol !== 'http:') return;
    Linking.openURL(url).catch(() => {});
  } catch {}
}

export function useApplyJob(job: Job) {
  const { markApplied, isApplied } = useApplicationStore();
  const { addInteraction } = useInteractionStore();
  const { trackJobApplied } = useJobAnalytics();

  const applySubRef = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);
  const applyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applied = isApplied(job.id);

  const handleApply = useCallback(() => {
    if (applied) { safeOpenURL(job.url); return; }
    if (applySubRef.current) return;
    safeOpenURL(job.url);

    const session = useAuthStore.getState().session;
    if (!session) return;

    const openedAt = Date.now();
    applySubRef.current = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        applySubRef.current?.remove();
        applySubRef.current = null;
        if (Date.now() - openedAt < 2500) return;
        applyTimeoutRef.current = setTimeout(() => {
          applyTimeoutRef.current = null;
          Alert.alert(
            'Başvuru tamamlandı mı?',
            `${job.company} pozisyonuna başvurdunuz mu?`,
            [
              {
                text: 'Evet, başvurdum',
                onPress: () => {
                  markApplied(job);
                  addInteraction({ jobId: job.id, action: 'apply', timestamp: Date.now() });
                  api.postInteraction(job.id, 'apply', job).catch(() => {});
                  trackJobApplied(job);
                },
              },
              { text: 'Hayır', style: 'cancel' },
            ]
          );
        }, 400);
      }
    });
  }, [applied, job, markApplied, addInteraction, trackJobApplied]);

  const cleanup = useCallback(() => {
    applySubRef.current?.remove();
    applySubRef.current = null;
    if (applyTimeoutRef.current) {
      clearTimeout(applyTimeoutRef.current);
      applyTimeoutRef.current = null;
    }
  }, []);

  return { applied, handleApply, cleanup };
}
