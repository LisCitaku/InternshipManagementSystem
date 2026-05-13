import type { AuthTokens } from '@/types';

const AUTH_KEY = 'ijmp.auth';
const THEME_KEY = 'ijmp.theme';
const SAVED_JOB_FILTERS_KEY = 'ijmp.saved-job-filters';

export interface SavedJobFilter {
  id: string;
  label: string;
  search: string;
  location: string;
  savedAt: string;
}

export const storage = {
  getAuth(): AuthTokens | null {
    const raw = window.localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  },
  setAuth(value: AuthTokens | null) {
    if (!value) {
      window.localStorage.removeItem(AUTH_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(value));
  },
  getTheme(): 'light' | 'dark' | null {
    const theme = window.localStorage.getItem(THEME_KEY);
    return theme === 'light' || theme === 'dark' ? theme : null;
  },
  setTheme(theme: 'light' | 'dark') {
    window.localStorage.setItem(THEME_KEY, theme);
  },
  getSavedJobFilters(): SavedJobFilter[] {
    const raw = window.localStorage.getItem(SAVED_JOB_FILTERS_KEY);
    if (!raw) return [];

    try {
      return JSON.parse(raw) as SavedJobFilter[];
    } catch {
      return [];
    }
  },
  setSavedJobFilters(filters: SavedJobFilter[]) {
    window.localStorage.setItem(SAVED_JOB_FILTERS_KEY, JSON.stringify(filters));
  },
};
