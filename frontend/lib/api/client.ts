// Carries the HTTP status and parsed error body so callers can read extra fields
// (e.g. `problems` on a 422). Still an Error, so existing `catch` blocks are unaffected.
export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly data: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Always use relative URLs — Next.js proxy handles /api/* in dev,
  // CloudFront routes /api/* to API Gateway in production.
  const url = endpoint;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: string };
    throw new ApiError(errorData.error || `HTTP ${response.status}`, response.status, errorData);
  }

  return response.json() as Promise<T>;
}

export function adminHeaders(adminKey: string): Record<string, string> {
  return { 'x-admin-key': adminKey };
}
