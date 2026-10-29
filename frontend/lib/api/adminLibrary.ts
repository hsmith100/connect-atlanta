import type {
  PhotoCollection, CollectionCreatePayload, CollectionUpdatePayload,
  LibraryPhoto, LibraryPresignRequest, LibraryPresignResponse, LibraryPhotoCreatePayload, LibraryPhotoUpdatePayload,
  LibraryPhotoReplaceRequest, LibraryPhotoReplaceComplete, LibraryPhotoDeleteResponse,
} from '@shared/types/store';
import { fetchAPI, adminHeaders } from './client';

const BASE = '/api/admin/library';

function send<T>(adminKey: string, path: string, method: string, body?: unknown): Promise<T> {
  return fetchAPI<T>(`${BASE}${path}`, {
    method,
    headers: adminHeaders(adminKey),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

// ── Collections (one per event) ──────────────────────────────────────────────

export async function getPhotoCollections(adminKey: string): Promise<PhotoCollection[]> {
  return (await send<{ collections: PhotoCollection[] }>(adminKey, '/collections', 'GET')).collections;
}

export function createPhotoCollection(adminKey: string, payload: CollectionCreatePayload): Promise<PhotoCollection> {
  return send<PhotoCollection>(adminKey, '/collections', 'POST', payload);
}

export function updatePhotoCollection(adminKey: string, id: string, payload: CollectionUpdatePayload): Promise<PhotoCollection> {
  return send<PhotoCollection>(adminKey, `/collections/${encodeURIComponent(id)}`, 'PATCH', payload);
}

export async function deletePhotoCollection(adminKey: string, id: string): Promise<void> {
  await send<{ deleted: boolean }>(adminKey, `/collections/${encodeURIComponent(id)}`, 'DELETE');
}

// ── Photos ───────────────────────────────────────────────────────────────────

export async function getCollectionPhotos(adminKey: string, collectionId: string): Promise<LibraryPhoto[]> {
  return (await send<{ photos: LibraryPhoto[] }>(adminKey, `/collections/${encodeURIComponent(collectionId)}/photos`, 'GET')).photos;
}

export async function getGalleryPhotos(adminKey: string): Promise<LibraryPhoto[]> {
  return (await send<{ photos: LibraryPhoto[] }>(adminKey, '/gallery', 'GET')).photos;
}

export function presignLibraryPhotos(adminKey: string, requests: LibraryPresignRequest[]): Promise<LibraryPresignResponse[]> {
  return send<LibraryPresignResponse[]>(adminKey, '/photos/presign', 'POST', requests);
}

export async function createLibraryPhotos(adminKey: string, photos: LibraryPhotoCreatePayload[]): Promise<void> {
  await send<{ created: number }>(adminKey, '/photos', 'POST', photos);
}

export async function updateLibraryPhotos(adminKey: string, updates: LibraryPhotoUpdatePayload[]): Promise<void> {
  await send<{ updated: number }>(adminKey, '/photos', 'PATCH', updates);
}

export function deleteLibraryPhotos(adminKey: string, ids: string[]): Promise<LibraryPhotoDeleteResponse> {
  return send<LibraryPhotoDeleteResponse>(adminKey, '/photos', 'DELETE', { ids });
}

export function presignReplace(adminKey: string, id: string, request: LibraryPhotoReplaceRequest): Promise<LibraryPresignResponse> {
  return send<LibraryPresignResponse>(adminKey, `/photos/${encodeURIComponent(id)}/replace`, 'POST', request);
}

export function completeReplace(adminKey: string, id: string, payload: LibraryPhotoReplaceComplete): Promise<LibraryPhoto> {
  return send<LibraryPhoto>(adminKey, `/photos/${encodeURIComponent(id)}/replace`, 'PATCH', payload);
}
