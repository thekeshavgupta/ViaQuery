export const CONTINENTS = [
  'All Continents',
  'North America',
  'Europe',
  'Asia',
  'South America',
  'Oceania',
  'Africa'
] as const;

export type Continent = typeof CONTINENTS[number];

export const CONTINENT_TO_COUNTRIES: Record<string, string[]> = {
  'North America': [
    'United States', 'USA', 'US', 'U.S.', 'Canada', 'Mexico',
    'Costa Rica', 'Panama', 'Jamaica', 'Dominican Republic'
  ],
  'Europe': [
    'United Kingdom', 'UK', 'U.K.', 'England', 'Scotland', 'Germany', 'France',
    'Netherlands', 'Ireland', 'Switzerland', 'Sweden', 'Spain', 'Poland', 'Italy',
    'Norway', 'Denmark', 'Finland', 'Portugal', 'Austria', 'Belgium', 'Czech Republic',
    'Romania', 'Greece', 'Hungary', 'Bulgaria', 'Croatia', 'Estonia'
  ],
  'Asia': [
    'India', 'China', 'Japan', 'Singapore', 'South Korea', 'Israel', 'Taiwan',
    'United Arab Emirates', 'UAE', 'Saudi Arabia', 'Vietnam', 'Indonesia',
    'Malaysia', 'Thailand', 'Philippines', 'Hong Kong'
  ],
  'South America': [
    'Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Uruguay'
  ],
  'Oceania': [
    'Australia', 'New Zealand'
  ],
  'Africa': [
    'South Africa', 'Nigeria', 'Kenya', 'Egypt', 'Ghana'
  ]
};

export const TECH_HUBS_CONTINENT: Record<string, string> = {
  // North America
  'san francisco': 'North America', 'sf': 'North America', 'bay area': 'North America',
  'seattle': 'North America', 'new york': 'North America', 'nyc': 'North America',
  'austin': 'North America', 'boston': 'North America', 'chicago': 'North America',
  'los angeles': 'North America', 'san jose': 'North America', 'sunnyvale': 'North America',
  'mountain view': 'North America', 'palo alto': 'North America', 'toronto': 'North America',
  'vancouver': 'North America', 'montreal': 'North America', 'remote us': 'North America',
  'remote - us': 'North America', 'remote (us)': 'North America', 'united states': 'North America',

  // Europe
  'london': 'Europe', 'berlin': 'Europe', 'munich': 'Europe', 'amsterdam': 'Europe',
  'dublin': 'Europe', 'paris': 'Europe', 'zurich': 'Europe', 'stockholm': 'Europe',
  'madrid': 'Europe', 'barcelona': 'Europe', 'warsaw': 'Europe', 'remote europe': 'Europe',
  'remote (eu)': 'Europe', 'remote - eu': 'Europe',

  // Asia
  'bangalore': 'Asia', 'bengaluru': 'Asia', 'hyderabad': 'Asia', 'pune': 'Asia',
  'mumbai': 'Asia', 'delhi': 'Asia', 'noida': 'Asia', 'gurgaon': 'Asia', 'gurugram': 'Asia',
  'tokyo': 'Asia', 'singapore': 'Asia', 'seoul': 'Asia', 'tel aviv': 'Asia',

  // Oceania
  'sydney': 'Oceania', 'melbourne': 'Oceania', 'brisbane': 'Oceania', 'auckland': 'Oceania',

  // South America
  'sao paulo': 'South America', 'buenos aires': 'South America', 'bogota': 'South America'
};

export function isLocationInContinent(locationText: string, targetContinent: string): boolean {
  if (!targetContinent || targetContinent === 'All Continents') return true;
  if (!locationText) return false;

  const loc = locationText.toLowerCase().trim();

  // 1. Direct Continent Name
  if (loc.includes(targetContinent.toLowerCase())) return true;

  // 2. Hub match
  for (const [hub, cont] of Object.entries(TECH_HUBS_CONTINENT)) {
    if (cont === targetContinent && loc.includes(hub)) {
      return true;
    }
  }

  // 3. Country match
  const countries = CONTINENT_TO_COUNTRIES[targetContinent] || [];
  for (const country of countries) {
    const cLower = country.toLowerCase();
    if (cLower.length <= 3) {
      const regex = new RegExp(`\\b${cLower}\\b`, 'i');
      if (regex.test(loc)) return true;
    } else {
      if (loc.includes(cLower)) return true;
    }
  }

  return false;
}

export function isLocationInAnyContinent(locationText: string, targetContinents: string[]): boolean {
  if (targetContinents.length === 0 || targetContinents.includes('All Continents')) return true;
  return targetContinents.some(continent => isLocationInContinent(locationText, continent));
}
