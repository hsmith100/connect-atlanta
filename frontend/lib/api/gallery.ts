import type { Photo } from '@shared/types/photos';
import { fetchAPI } from './client';

export async function getGallery(eventId?: string): Promise<{ photos: Photo[] }> {
  const qs = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
  return fetchAPI<{ photos: Photo[] }>(`/api/gallery${qs}`);
}

export async function getEventGallery(eventId: string): Promise<{ photos: Photo[] }> {
  return getGallery(eventId);
}
