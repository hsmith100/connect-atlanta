import type { Photo, PresignRequest, PresignResponse, PhotoCreatePayload, PhotoUpdatePayload } from '@shared/types/photos';
import { fetchAPI, adminHeaders } from './client';

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
