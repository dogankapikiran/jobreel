import { Interaction, Job, UserPreferences } from '@/types';

export function hardFilter(jobs: Job[], prefs: UserPreferences): Job[] {
  return jobs.filter((job) => {
    if (
      prefs.workType !== 'any' &&
      job.workType !== 'unknown' &&
      job.workType !== prefs.workType
    ) {
      return false;
    }
    if (prefs.salaryMin > 0 && job.salaryMin && job.salaryMin < prefs.salaryMin) {
      return false;
    }
    return true;
  });
}

export function scoreJob(
  job: Job,
  prefs: UserPreferences,
  interactions: Interaction[]
): number {
  // Skill match (40%)
  const matchedSkills = job.skills.filter((s) =>
    prefs.skills.some((ps) => ps.toLowerCase() === s.toLowerCase())
  );
  const skillScore = job.skills.length > 0 ? matchedSkills.length / job.skills.length : 0.5;

  // Seniority match (25%)
  const seniorityScore = prefs.seniority.includes(job.seniority) ? 1 : 0.3;

  // Sector preference (20%)
  const sectorScore =
    prefs.sectors.length === 0 ||
    prefs.sectors.some((s) => job.sector.toLowerCase().includes(s.toLowerCase()))
      ? 1
      : 0.3;

  // Company size (10%) — neutral for now
  const sizeScore = 0.5;

  // Behavioral signals (5%)
  const behaviorScore = computeBehaviorScore(job.id, interactions);

  return (
    skillScore * 0.4 +
    seniorityScore * 0.25 +
    sectorScore * 0.2 +
    sizeScore * 0.1 +
    behaviorScore * 0.05
  );
}

function computeBehaviorScore(jobId: string, interactions: Interaction[]): number {
  let bonus = 0;
  for (const i of interactions) {
    if (i.jobId !== jobId) continue;
    if (i.action === 'view' && (i.durationSeconds ?? 0) >= 10) bonus += 0.3;
    if (i.action === 'save') bonus += 0.8;
    if (i.action === 'apply') bonus += 1.0;
    if (i.action === 'skip') bonus -= 0.2;
  }
  return Math.max(0, Math.min(1, 0.5 + bonus));
}

// Every 5th slot inject a surprise from an unseen sector
export function injectDiversity(scored: Job[], pool: Job[]): Job[] {
  const result = [...scored];
  const seenSectors = new Set(scored.map((j) => j.sector));

  for (let i = 4; i < result.length; i += 5) {
    const surprise = pool.find(
      (j) => !seenSectors.has(j.sector) && !result.find((rj) => rj.id === j.id)
    );
    if (surprise) {
      result.splice(i, 0, surprise);
      seenSectors.add(surprise.sector);
    }
  }

  return result;
}

export function buildFeed(
  jobs: Job[],
  prefs: UserPreferences,
  interactions: Interaction[]
): Job[] {
  const filtered = hardFilter(jobs, prefs);
  const scored = filtered
    .map((job) => ({ ...job, score: scoreJob(job, prefs, interactions) }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return injectDiversity(scored, jobs);
}
