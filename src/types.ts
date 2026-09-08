export interface CompanyRecord {
  Company: string;
  ATS: string;
  'Job URL'?: string;
  jobUrl?: string; // normalized
  normalizedAts: 'greenhouse' | 'ashby' | 'lever' | 'smartrecruiters' | 'workday' | 'internal' | 'other';
  slug: string;
  sampleUrl: string;
  isInternalOrUnsupported: boolean;
}

export interface JobItem {
  id: string;
  title: string;
  company: string;
  ats: string;
  location: string;
  url: string;
  description: string;
  experience: string;
  departments: string[];
  updatedAt?: string;
}

export interface FilterState {
  role: string;
  location: string;
  continent: string;
  keywords: string;
}

export interface AppliedJob {
  id: string;
  title: string;
  company: string;
  ats: string;
  location: string;
  url: string;
  experience?: string;
  appliedAt: string; // ISO string
}

