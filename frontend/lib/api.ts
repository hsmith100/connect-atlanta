// API client — all requests go to /api/* which CloudFront proxies to API Gateway.
// In local dev, NEXT_PUBLIC_API_URL points to the staging API Gateway URL.
import type { Event } from '@shared/types/events';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchAPI(endpoint: string, options: RequestInit = {}): Promise<unknown> {
  const url = `${API_BASE_URL}${endpoint}`;

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

  return response.json();
}

export async function getEvents(): Promise<Event[]> {
  return fetchAPI('/api/events') as Promise<Event[]>;
}

export async function getEvent(eventId: string): Promise<Event> {
  return fetchAPI(`/api/events/${eventId}`) as Promise<Event>;
}

// Gallery endpoints — implemented in Phase 5 (S3 photo migration)
export async function getGallery(): Promise<unknown> {
  return fetchAPI('/api/gallery');
}

export async function getEventGallery(eventId: string): Promise<unknown> {
  return fetchAPI(`/api/events/${eventId}/gallery`);
}

export async function submitForm(formType: string, data: Record<string, unknown>): Promise<unknown> {
  return fetchAPI(`/api/forms/${formType}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
