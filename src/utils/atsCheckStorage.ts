const STORAGE_KEY = 'viaquery_ats_last_checked_v1';

type LastCheckedMap = Record<string, string>;

function readLastChecked(): LastCheckedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === 'string' && !Number.isNaN(Date.parse(value)))
    );
  } catch {
    return {};
  }
}

export function getLastChecked(company: string): string | undefined {
  return readLastChecked()[company];
}

export function getLastCheckedMap(): LastCheckedMap {
  return readLastChecked();
}

export function markLastChecked(company: string): string {
  const checkedAt = new Date().toISOString();
  const current = readLastChecked();
  current[company] = checkedAt;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Storage may be unavailable; the click still opens the portal.
  }
  return checkedAt;
}
