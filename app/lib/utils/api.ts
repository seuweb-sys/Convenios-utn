export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
} 