import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const normalizePhoneDigits = (value?: string) => (value || '').replace(/\D/g, '').trim();

export const isTenDigitPhone = (value?: string) => {
  const digits = normalizePhoneDigits(value);
  return digits.length === 10;
};

const TECHNICAL_ERROR_PATTERNS = [
  /jwt/i,
  /token/i,
  /foreign key/i,
  /constraint/i,
  /violates/i,
  /duplicate key/i,
  /syntax/i,
  /stack/i,
  /trace/i,
  /undefined/i,
  /null/i,
  /cannot read/i,
  /is not a function/i,
  /networkerror/i,
  /failed to fetch/i,
  /http\s+\d+/i,
  /\b\d{3}\b/,
  /sql/i,
  /postgres/i,
  /database/i,
];

const GENERIC_FRIENDLY_ERROR =
  'Something went wrong. Please try again in a moment. If this keeps happening, contact support.';

export const getFriendlyStatusMessage = (status: number, fallback = GENERIC_FRIENDLY_ERROR) => {
  if (status === 400) return 'Some information looks incorrect. Please check the form and try again.';
  if (status === 401 || status === 403)
    return 'Your session has expired. Please sign in again to continue.';
  if (status === 404) return 'We could not find this item. It may have been removed or updated.';
  if (status === 409) return 'This change conflicts with existing information. Please review and try again.';
  if (status === 422) return 'Some required information is missing or invalid. Please review the form.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500) return 'The service is temporarily unavailable. Please try again shortly.';
  return fallback;
};

export const toUserFacingMessage = (message: string | undefined, fallback = GENERIC_FRIENDLY_ERROR) => {
  const trimmed = message?.trim();
  if (!trimmed) return fallback;
  if (TECHNICAL_ERROR_PATTERNS.some(pattern => pattern.test(trimmed))) return fallback;
  return trimmed;
};

export const getErrorMessage = (error: unknown, fallback = 'Something went wrong') => {
  if (error instanceof Error) return toUserFacingMessage(error.message, fallback);
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return toUserFacingMessage(message, fallback);
  }
  if (typeof error === 'string' && error.trim()) return toUserFacingMessage(error, fallback);
  return fallback;
};

// Helper function to get auth token
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Helper function to make API request with status code
export async function apiRequestWithStatus(
  endpoint: string,
  options: { method?: string; body?: string } = {}
): Promise<{ status: number; message: string; data?: unknown }> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const API_KEY = import.meta.env.VITE_API_KEY || '';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  const token = getAuthToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  const message = response.ok
    ? toUserFacingMessage(data.message, 'Saved successfully.')
    : toUserFacingMessage(data.message, getFriendlyStatusMessage(response.status));

  return {
    status: response.status,
    message,
    data: response.ok ? data : undefined,
  };
}
