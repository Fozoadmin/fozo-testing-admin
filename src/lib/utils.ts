import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const normalizePhoneDigits = (value?: string) => (value || "").replace(/\D/g, "").trim();

export const isTenDigitPhone = (value?: string) => {
  const digits = normalizePhoneDigits(value);
  return digits.length === 10;
};

// Helper function to get auth token
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Helper function to make API request with status code
export async function apiRequestWithStatus(
  endpoint: string,
  options: { method?: string; body?: string } = {}
): Promise<{ status: number; message: string; data?: any }> {
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
  const message = data.message || (response.ok ? 'Success' : 'Request failed');

  return {
    status: response.status,
    message,
    data: response.ok ? data : undefined,
  };
}
