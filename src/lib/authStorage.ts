import type { User } from '@/contexts/AuthContext';

const USER_STORAGE_KEY = 'user';
const ACCESS_TOKEN_STORAGE_KEY = 'auth_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

export interface StoredAuthSession {
  user: User;
  accessToken: string | null;
  refreshToken: string;
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function getStoredAuthSession(): StoredAuthSession | null {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  const refreshToken = getStoredRefreshToken();

  if (!storedUser || !refreshToken) {
    return null;
  }

  try {
    return {
      user: JSON.parse(storedUser) as User,
      accessToken: getStoredAccessToken(),
      refreshToken,
    };
  } catch (error) {
    console.error('Error parsing stored user data:', error);
    clearStoredAuthSession();
    return null;
  }
}

export function persistAuthSession(user: User, accessToken: string, refreshToken: string) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function persistAccessToken(accessToken: string) {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
}

export function persistRefreshToken(refreshToken: string) {
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function clearStoredAuthSession() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}
