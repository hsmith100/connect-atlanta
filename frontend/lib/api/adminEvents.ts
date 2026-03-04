import type { Event } from '@shared/types/events';
import type { FlyerPresignResponse } from '@shared/types/photos';
import { fetchAPI, adminHeaders } from './client';

export async function getAdminEvents(adminKey: string): Promise<Event[]> {
  return fetchAPI<Event[]>('/api/admin/events', {
    headers: adminHeaders(adminKey),
  });
}

export async function createEvent(
  adminKey: string,
  event: { id: string; title: string; date: string; startTime?: string; endTime?: string; location?: string; flyerUrl?: string; goLiveAt?: string; ticketingUrl?: string },
): Promise<void> {
  await fetchAPI<{ created: boolean }>('/api/admin/events', {
    method: 'POST',
    headers: adminHeaders(adminKey),
    body: JSON.stringify(event),
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

export async function deleteEvent(adminKey: string, eventId: string): Promise<void> {
  await fetchAPI<{ deleted: boolean }>(`/api/admin/events/${eventId}`, {
    method: 'DELETE',
    headers: adminHeaders(adminKey),
  });
}

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
