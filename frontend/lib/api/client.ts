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
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function adminHeaders(adminKey: string): Record<string, string> {
  return { 'x-admin-key': adminKey };
}
