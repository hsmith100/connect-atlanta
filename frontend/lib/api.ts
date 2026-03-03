// API client — all requests go to /api/* which CloudFront proxies to API Gateway.
// In local dev, NEXT_PUBLIC_API_URL points to the staging API Gateway URL.
import type { Event } from '@shared/types/events';
import type {
  Photo,
  PresignRequest,
  PresignResponse,
  PhotoCreatePayload,
  PhotoUpdatePayload,
  FlyerPresignResponse,
} from '@shared/types/photos';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  return response.json() as Promise<T>;
}

export async function getEvents(): Promise<Event[]> {
  return fetchAPI<Event[]>('/api/events');
}

export async function getEvent(eventId: string): Promise<Event> {
  return fetchAPI<Event>(`/api/events/${eventId}`);
}

// ── Gallery ───────────────────────────────────────────────────────────────────

export async function getGallery(eventId?: string): Promise<{ photos: Photo[] }> {
  const qs = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
  return fetchAPI<{ photos: Photo[] }>(`/api/gallery${qs}`);
}

export async function getEventGallery(eventId: string): Promise<{ photos: Photo[] }> {
  return getGallery(eventId);
}

// ── Admin photos ──────────────────────────────────────────────────────────────

function adminHeaders(adminKey: string): Record<string, string> {
  return { 'x-admin-key': adminKey };
}

export async function getAdminEvents(adminKey: string): Promise<Event[]> {
  return fetchAPI<Event[]>('/api/admin/events', {
    headers: adminHeaders(adminKey),
  });
}

export async function createEvent(
  adminKey: string,
  event: { id: string; title: string; date: string; time?: string; location?: string; goLiveAt?: string; ticketingUrl?: string },
): Promise<void> {
  await fetchAPI<{ created: boolean }>('/api/admin/events', {
    method: 'POST',
    headers: adminHeaders(adminKey),
    body: JSON.stringify(event),
  });
}

export async function getAdminPhotos(adminKey: string): Promise<{ photos: Photo[] }> {
  return fetchAPI<{ photos: Photo[] }>('/api/admin/photos', {
    headers: adminHeaders(adminKey),
  });
}

export async function presignPhotos(adminKey: string, files: PresignRequest[]): Promise<PresignResponse[]> {
  return fetchAPI<PresignResponse[]>('/api/admin/photos/presign', {
    method: 'POST',
    headers: adminHeaders(adminKey),
    body: JSON.stringify(files),
  });
}

export async function createPhotos(adminKey: string, photos: PhotoCreatePayload[]): Promise<void> {
  await fetchAPI<{ created: number }>('/api/admin/photos', {
    method: 'POST',
    headers: adminHeaders(adminKey),
    body: JSON.stringify(photos),
  });
}

export async function updatePhotos(adminKey: string, updates: PhotoUpdatePayload[]): Promise<void> {
  await fetchAPI<{ updated: number }>('/api/admin/photos', {
    method: 'PATCH',
    headers: adminHeaders(adminKey),
    body: JSON.stringify(updates),
  });
}

export async function deletePhotos(adminKey: string, ids: string[]): Promise<void> {
  await fetchAPI<{ deleted: number }>('/api/admin/photos', {
    method: 'DELETE',
    headers: adminHeaders(adminKey),
    body: JSON.stringify({ ids }),
  });
}

// ── Admin flyers ──────────────────────────────────────────────────────────────

export async function presignFlyer(
  adminKey: string,
  eventId: string,
  filename: string,
  contentType: string,
): Promise<FlyerPresignResponse> {
  return fetchAPI<FlyerPresignResponse>('/api/admin/flyers/presign', {
    method: 'POST',
    headers: adminHeaders(adminKey),
    body: JSON.stringify({ eventId, filename, contentType }),
  });
}

export async function updateEventFlyer(
  adminKey: string,
  eventId: string,
  flyerUrl: string,
  goLiveAt?: string,
): Promise<void> {
  await fetchAPI<{ updated: boolean }>(`/api/admin/events/${eventId}`, {
    method: 'PATCH',
    headers: adminHeaders(adminKey),
    body: JSON.stringify({ flyerUrl, ...(goLiveAt !== undefined ? { goLiveAt } : {}) }),
  });
}

export async function updateEventGoLive(
  adminKey: string,
  eventId: string,
  goLiveAt: string | null,
): Promise<void> {
  await fetchAPI<{ updated: boolean }>(`/api/admin/events/${eventId}`, {
    method: 'PATCH',
    headers: adminHeaders(adminKey),
    body: JSON.stringify({ goLiveAt }),
  });
}

export async function submitForm(formType: string, data: Record<string, string | number | boolean | null | string[]>): Promise<{ message?: string }> {
  return fetchAPI<{ message?: string }>(`/api/forms/${formType}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
