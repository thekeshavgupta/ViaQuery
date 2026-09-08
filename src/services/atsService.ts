// Experience Regex patterns
const EXPERIENCE_PATTERNS = [
  /(\b(?:minimum\s+|at\s+least\s+)?\d+\s*(?:[-–to]+\s*\d+)?\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+[\w/-]+){0,5}\s+experience\b)/i,
  /(\b(?:minimum\s+|at\s+least\s+)?\d+\s*(?:[-–to]+\s*\d+)?\+?\s*(?:years?|yrs?)\s+(?:working|building|coding|in\s+software)\b)/i,
  /(\b\d+\s*(?:[-–to]+\s*\d+)?\+?\s*(?:years?|yrs?)(?:\s+of)?\s+exp\b)/i,
  /(\b(?:minimum|at\s+least)\s+\d+\+?\s*(?:years?|yrs?)\b)/i
];

function normalizeTimestamp(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function extractExperience(text: string, title: string = ''): string {
  const combined = text ? `${title}. ${text}` : title;
  if (!combined) return 'Not specified';

  for (const pattern of EXPERIENCE_PATTERNS) {
    const match = combined.match(pattern);
    if (match && match[1]) {
      const val = match[1].trim();
      return val.charAt(0).toUpperCase() + val.slice(1);
    }
  }

  const titleLower = title.toLowerCase();
  if (titleLower.includes('intern')) {
    return 'Internship (Students/New Grads)';
  } else if (titleLower.includes('new grad') || titleLower.includes('entry level')) {
    return '0-1 years (New Grad / Entry)';
  }

  return 'Not specified';
}

export function cleanHtml(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * Intelligent slug extraction from company name, ATS, and Sample Job URL
 */
export function parseAtsAndSlug(company: string, rawAts: string, sampleUrl: string = ''): {
  normalizedAts: 'greenhouse' | 'ashby' | 'lever' | 'smartrecruiters' | 'workday' | 'internal' | 'other';
  slug: string;
  isInternalOrUnsupported: boolean;
} {
  const atsLower = (rawAts || '').trim().toLowerCase();
  const urlLower = (sampleUrl || '').trim().toLowerCase();
  const compSlug = company.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const isStaleGrammarlyAshbyRow = compSlug === 'grammarly' && urlLower.includes('superhuman.com');
  const isEmployCareersRow = urlLower.includes('careers.employinc.com');
  const isHrtCustomCareersRow = compSlug === 'hudsonrivertrading' && urlLower.includes('hudsonrivertrading.com');
  const isWeightsAndBiasesRow = compSlug === 'weightsandbiases' || compSlug === 'wandb';
  const isTinderRow = compSlug === 'tinder';

  let normalizedAts: 'greenhouse' | 'ashby' | 'lever' | 'smartrecruiters' | 'workday' | 'internal' | 'other' = 'other';
  let slug = compSlug;

  // 1. Detect ATS type from explicit column or URL
  if (isWeightsAndBiasesRow) {
    normalizedAts = 'greenhouse';
  } else if (isTinderRow) {
    normalizedAts = 'lever';
  } else if (isStaleGrammarlyAshbyRow || isEmployCareersRow || isHrtCustomCareersRow) {
    normalizedAts = 'other';
  } else if (atsLower.includes('greenhouse') || urlLower.includes('greenhouse.io') || urlLower.includes('grnhse_app')) {
    normalizedAts = 'greenhouse';
  } else if (atsLower.includes('ashby') || urlLower.includes('ashbyhq.com') || urlLower.includes('ashby_jid')) {
    normalizedAts = 'ashby';
  } else if (atsLower.includes('lever') || urlLower.includes('lever.co')) {
    normalizedAts = 'lever';
  } else if (atsLower.includes('smartrecruiters') || atsLower.includes('smart recruiters') || urlLower.includes('smartrecruiters.com')) {
    normalizedAts = 'smartrecruiters';
  } else if (atsLower.includes('workday') || urlLower.includes('myworkdayjobs.com')) {
    normalizedAts = 'workday';
  } else if (atsLower.includes('internal') || atsLower.includes('oracle') || atsLower.includes('icims') || atsLower.includes('taleo')) {
    normalizedAts = 'internal';
  } else {
    // If ATS is blank or unsupported portal
    if (!rawAts || rawAts.trim() === '' || atsLower === 'internal') {
      normalizedAts = 'internal';
    }
  }

  // 2. Extract Slug from URL when possible
  if (sampleUrl) {
    if (normalizedAts === 'greenhouse') {
      // Examples:
      // https://job-boards.greenhouse.io/adyen/jobs/7546966 -> adyen
      // https://job-boards.greenhouse.io/embed/job_app?token=8067033&for=coinbase -> coinbase
      // https://job-boards.eu.greenhouse.io/mariadbplc/jobs/4936567101 -> mariadbplc
      const mEmbed = sampleUrl.match(/for=([a-zA-Z0-9_-]+)/);
      if (mEmbed) {
        slug = mEmbed[1];
      } else {
        const mBoard = sampleUrl.match(/greenhouse\.io\/([a-zA-Z0-9_-]+)/);
        if (mBoard && mBoard[1] !== 'embed') {
          slug = mBoard[1];
        }
      }
    } else if (normalizedAts === 'ashby') {
      // Examples:
      // https://jobs.ashbyhq.com/cohere/... -> cohere
      // https://jobs.ashbyhq.com/mistral.ai/... -> mistral.ai
      // https://cursor.com/careers/... -> cursor
      const mAshby = sampleUrl.match(/ashbyhq\.com\/([a-zA-Z0-9_.-]+)/);
      if (mAshby) {
        slug = mAshby[1];
      } else if (urlLower.includes('marqeta.com')) {
        slug = 'marqeta-inc';
      } else if (urlLower.includes('hinge.co')) {
        slug = 'matchgroup';
      } else if (sampleUrl.includes('cursor.com')) {
        slug = 'cursor';
      }
    } else if (normalizedAts === 'lever') {
      // Examples:
      // https://jobs.lever.co/blablacar/... -> blablacar
      const mLever = sampleUrl.match(/lever\.co\/([a-zA-Z0-9_-]+)/);
      if (mLever) {
        slug = mLever[1];
      }
    } else if (normalizedAts === 'smartrecruiters') {
      const mSmart = sampleUrl.match(/smartrecruiters\.com\/([a-zA-Z0-9_-]+)/);
      if (mSmart) {
        slug = mSmart[1];
      }
    }
  }

  if (isWeightsAndBiasesRow) {
    slug = 'weights_and_biases';
  } else if (isTinderRow) {
    slug = 'matchgroup';
  }

  const isInternalOrUnsupported =
    normalizedAts === 'internal' ||
    normalizedAts === 'other' ||
    normalizedAts === 'workday' ||
    !rawAts;

  return {
    normalizedAts,
    slug,
    isInternalOrUnsupported
  };
}

/**
 * Direct fetchers for supported open ATS APIs with CORS support
 */
export async function fetchGreenhouseJobs(slug: string, companyName: string, signal?: AbortSignal) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`;
  const resp = await fetch(url, { signal });
  if (!resp.ok) throw new Error(`Greenhouse API returned ${resp.status}`);
  const data = await resp.json();
  const jobs = [];
  for (const j of data.jobs || []) {
    const rawContent = j.content || '';
    const desc = cleanHtml(rawContent);
    const title = j.title || '';
    jobs.push({
      id: String(j.id),
      title: title,
      company: companyName,
      ats: 'Greenhouse',
      location: j.location?.name || '',
      url: j.absolute_url || '',
      description: desc,
      experience: extractExperience(desc, title),
      departments: (j.departments || []).map((d: any) => d.name).filter(Boolean),
      updatedAt: normalizeTimestamp(j.updated_at)
    });
  }
  return jobs;
}

export async function fetchLeverJobs(slug: string, companyName: string, signal?: AbortSignal) {
  const url = `https://api.lever.co/v0/postings/${slug}?mode=json`;
  const resp = await fetch(url, { signal });
  if (!resp.ok) throw new Error(`Lever API returned ${resp.status}`);
  const data = await resp.json();
  const jobs = [];
  if (Array.isArray(data)) {
    for (const j of data) {
      const desc = cleanHtml(j.descriptionPlain || j.description || j.additionalPlain || '');
      const title = j.text || '';
      jobs.push({
        id: String(j.id),
        title: title,
        company: companyName,
        ats: 'Lever',
        location: j.categories?.location || '',
        url: j.hostedUrl || '',
        description: desc,
        experience: extractExperience(desc, title),
        departments: j.categories?.team ? [j.categories.team] : [],
        updatedAt: normalizeTimestamp(j.createdAt)
      });
    }
  }
  return jobs;
}

export async function fetchAshbyJobs(slug: string, companyName: string, signal?: AbortSignal) {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
  const resp = await fetch(url, { signal });
  if (!resp.ok) throw new Error(`Ashby API returned ${resp.status}`);
  const data = await resp.json();
  const jobs = [];
  for (const j of data.jobs || []) {
    const title = j.title || '';
    const desc = cleanHtml(j.descriptionPlain || j.descriptionHtml || '');
    const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // For cursor, custom URL routing
    let jobUrl = j.jobUrl || '';
    if (slug.toLowerCase() === 'cursor') {
      jobUrl = titleSlug ? `https://cursor.com/careers/${titleSlug}` : j.jobUrl;
    } else if (!jobUrl) {
      jobUrl = `https://jobs.ashbyhq.com/${slug}/${titleSlug || j.id}`;
    }

    jobs.push({
      id: String(j.id),
      title: title,
      company: companyName,
      ats: 'Ashby',
      location: j.location || (j.secondaryLocations?.[0]?.location) || '',
      url: jobUrl,
      description: desc,
      experience: extractExperience(desc, title),
      departments: j.department ? [j.department] : [],
      updatedAt: normalizeTimestamp(j.publishedAt)
    });
  }
  return jobs;
}

export async function fetchSmartRecruitersJobs(slug: string, companyName: string, signal?: AbortSignal) {
  const url = `https://api.smartrecruiters.com/v1/companies/${slug}/postings`;
  const resp = await fetch(url, { signal });
  if (!resp.ok) throw new Error(`SmartRecruiters API returned ${resp.status}`);
  const data = await resp.json();
  const jobs = [];

  for (const job of data.content || []) {
    const title = job.name || '';
    const description = cleanHtml(job.jobAd?.sections?.map((section: any) => section.content || '').join(' ') || '');
    jobs.push({
      id: String(job.id || job.refNumber || ''),
      title,
      company: companyName,
      ats: 'SmartRecruiters',
      location: job.location?.fullLocation || '',
      url: `https://jobs.smartrecruiters.com/${slug}/${job.id}`,
      description,
      experience: extractExperience(description, title),
      departments: job.department?.label ? [job.department.label] : [],
      updatedAt: normalizeTimestamp(job.releasedDate)
    });
  }
  return jobs;
}

