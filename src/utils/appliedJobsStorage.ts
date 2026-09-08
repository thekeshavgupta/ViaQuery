import type { AppliedJob, JobItem } from '../types';

const STORAGE_KEY = 'swe_applied_jobs_db_v1';
const MAX_STORAGE_CHARS = 2_000_000;
const MAX_STORED_JOBS = 5_000;

function isAppliedJob(value: unknown): value is AppliedJob {
  if (!value || typeof value !== 'object') return false;
  const job = value as Partial<AppliedJob>;
  return typeof job.id === 'string' &&
    typeof job.title === 'string' &&
    typeof job.company === 'string' &&
    typeof job.ats === 'string' &&
    typeof job.location === 'string' &&
    typeof job.url === 'string' &&
    (job.experience === undefined || typeof job.experience === 'string') &&
    typeof job.appliedAt === 'string' &&
    !Number.isNaN(Date.parse(job.appliedAt));
}

export function getAppliedJobs(): Record<string, AppliedJob> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw.length > MAX_STORAGE_CHARS) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const result: Record<string, AppliedJob> = Object.create(null);
    for (const [key, value] of Object.entries(parsed)) {
      if (Object.keys(result).length >= MAX_STORED_JOBS) break;
      if (isAppliedJob(value) && key === value.id) {
        result[key] = value;
      }
    }
    return result;
  } catch (e) {
    console.error('Failed to parse applied jobs from localStorage', e);
    return {};
  }
}

export function saveAppliedJob(job: JobItem): void {
  const current = getAppliedJobs();
  if (typeof job.id !== 'string' || job.id.length === 0) return;
  if (!current[job.id] && Object.keys(current).length >= MAX_STORED_JOBS) return;
  const appliedEntry: AppliedJob = {
    id: job.id,
    title: job.title,
    company: job.company,
    ats: job.ats,
    location: job.location,
    url: job.url,
    experience: job.experience,
    appliedAt: new Date().toISOString()
  };
  current[job.id] = appliedEntry;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save applied job to localStorage', e);
  }
}

export function removeAppliedJob(jobId: string): void {
  const current = getAppliedJobs();
  delete current[jobId];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to remove applied job from localStorage', e);
  }
}

export function isJobApplied(jobId: string): boolean {
  const current = getAppliedJobs();
  return Boolean(current[jobId]);
}
