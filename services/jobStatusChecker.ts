import { useApplicationStore } from '@/store/applicationStore';
import { Job } from '@/types';

const CONCURRENCY = 3;
const TIMEOUT_MS = 8000;

async function isUrlClosed(url: string): Promise<boolean> {
  if (!url) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
    clearTimeout(timer);
    return res.status === 404 || res.status === 410;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

export async function checkClosedJobs(): Promise<void> {
  const { appliedJobs, markJobClosed } = useApplicationStore.getState();
  const toCheck = appliedJobs.filter((j: Job) => !j.isClosed && j.url);

  for (let i = 0; i < toCheck.length; i += CONCURRENCY) {
    const batch = toCheck.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (job: Job) => {
        const closed = await isUrlClosed(job.url);
        if (closed) markJobClosed(job.id);
      }),
    );
  }
}
