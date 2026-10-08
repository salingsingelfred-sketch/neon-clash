const SCORES_KEY = 'neonclash.scores.v1';
const NAME_KEY = 'neonclash.name.v1';
const PROFILES_KEY = 'neonclash.profiles.v1';
const ACTIVE_PROFILE_KEY = 'neonclash.active-profile.v1';

export type ScoreEntry = {
  name: string;
  charId: string;
  score: number;
  rounds: number;
  date: number;
};

export type LocalProfile = {
  id: string;
  name: string;
  createdAt: number;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch (error) {
    console.error(`Unable to read saved game data (${key}).`, error);
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Unable to save game data (${key}).`, error);
    return false;
  }
}

export function loadScores(): ScoreEntry[] {
  const scores = readJson<unknown>(SCORES_KEY, []);
  if (!Array.isArray(scores)) return [];
  return scores
    .filter(
      (entry): entry is ScoreEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.name === 'string' &&
        typeof entry.charId === 'string' &&
        Number.isFinite(entry.score) &&
        Number.isFinite(entry.rounds) &&
        Number.isFinite(entry.date),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export function saveScore(entry: ScoreEntry) {
  const scores = [...loadScores(), entry].sort((a, b) => b.score - a.score).slice(0, 10);
  writeJson(SCORES_KEY, scores);
  return scores;
}

export function renameEntry(date: number, name: string) {
  const scores = loadScores().map((entry) => (entry.date === date ? { ...entry, name } : entry));
  writeJson(SCORES_KEY, scores);
  return scores;
}

export function loadName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch (error) {
    console.error('Unable to load the saved pilot name.', error);
    return '';
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name.trim().slice(0, 12).toUpperCase());
  } catch (error) {
    console.error('Unable to save the pilot name.', error);
  }
}

export function loadProfiles(): LocalProfile[] {
  const profiles = readJson<unknown>(PROFILES_KEY, []);
  if (!Array.isArray(profiles)) return [];
  return profiles.filter(
    (profile): profile is LocalProfile =>
      typeof profile === 'object' &&
      profile !== null &&
      typeof profile.id === 'string' &&
      typeof profile.name === 'string' &&
      typeof profile.createdAt === 'number',
  );
}

export function activeProfileId() {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch (error) {
    console.error('Unable to load the selected pilot profile.', error);
    return null;
  }
}

export function activeProfile() {
  const id = activeProfileId();
  return loadProfiles().find((profile) => profile.id === id) ?? null;
}

export function createProfile(name: string): LocalProfile | null {
  const cleanName = name.trim().replace(/\s+/g, ' ').slice(0, 12);
  if (cleanName.length < 2) return null;
  const profiles = loadProfiles();
  const existing = profiles.find((profile) => profile.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return signInProfile(existing.id) ? existing : null;
  }

  const profile: LocalProfile = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: cleanName.toUpperCase(),
    createdAt: Date.now(),
  };
  if (!writeJson(PROFILES_KEY, [...profiles, profile])) return null;
  if (!signInProfile(profile.id)) return null;
  return profile;
}

export function signInProfile(id: string) {
  const profile = loadProfiles().find((entry) => entry.id === id);
  if (!profile) return false;
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    saveName(profile.name);
    return true;
  } catch (error) {
    console.error('Unable to select the local pilot profile.', error);
    return false;
  }
}

export function signOutProfile() {
  try {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
    saveName('PLAYER');
    return true;
  } catch (error) {
    console.error('Unable to sign out of the local pilot profile.', error);
    return false;
  }
}
