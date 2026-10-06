import type {
  Photographer, PhotographerCreatePayload, PhotographerUpdatePayload,
  StoreCollection, CollectionCreatePayload, CollectionUpdatePayload,
  StorePhoto, StorePresignRequest, StorePresignResponse, StorePhotoCreatePayload, StorePhotoUpdatePayload,
  StorePhotoReplaceRequest, StorePhotoReplaceComplete, StorePhotoDeleteResponse,
} from '@shared/types/store';
import { fetchAPI, adminHeaders } from './client';

const BASE = '/api/admin/store';

function send<T>(adminKey: string, path: string, method: string, body?: unknown): Promise<T> {
  return fetchAPI<T>(`${BASE}${path}`, {
    method,
    headers: adminHeaders(adminKey),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

// ── Photographers ────────────────────────────────────────────────────────────

export async function getPhotographers(adminKey: string): Promise<Photographer[]> {
  return (await send<{ photographers: Photographer[] }>(adminKey, '/photographers', 'GET')).photographers;
}

export function createPhotographer(adminKey: string, payload: PhotographerCreatePayload): Promise<Photographer> {
  return send<Photographer>(adminKey, '/photographers', 'POST', payload);
}

export function updatePhotographer(adminKey: string, id: string, payload: PhotographerUpdatePayload): Promise<Photographer> {
  return send<Photographer>(adminKey, `/photographers/${encodeURIComponent(id)}`, 'PATCH', payload);
}

// ── Collections ──────────────────────────────────────────────────────────────

export async function getStoreCollections(adminKey: string): Promise<StoreCollection[]> {
  return (await send<{ collections: StoreCollection[] }>(adminKey, '/collections', 'GET')).collections;
}

export function createStoreCollection(adminKey: string, payload: CollectionCreatePayload): Promise<StoreCollection> {
  return send<StoreCollection>(adminKey, '/collections', 'POST', payload);
}

export function updateStoreCollection(adminKey: string, id: string, payload: CollectionUpdatePayload): Promise<StoreCollection> {
  return send<StoreCollection>(adminKey, `/collections/${encodeURIComponent(id)}`, 'PATCH', payload);
}

export async function deleteStoreCollection(adminKey: string, id: string): Promise<void> {
  await send<{ deleted: boolean }>(adminKey, `/collections/${encodeURIComponent(id)}`, 'DELETE');
}

// ── Photos ───────────────────────────────────────────────────────────────────

export async function getCollectionPhotos(adminKey: string, collectionId: string): Promise<StorePhoto[]> {
  return (await send<{ photos: StorePhoto[] }>(adminKey, `/collections/${encodeURIComponent(collectionId)}/photos`, 'GET')).photos;
}

export function presignStorePhotos(adminKey: string, requests: StorePresignRequest[]): Promise<StorePresignResponse[]> {
  return send<StorePresignResponse[]>(adminKey, '/photos/presign', 'POST', requests);
}

export async function createStorePhotos(adminKey: string, photos: StorePhotoCreatePayload[]): Promise<void> {
  await send<{ created: number }>(adminKey, '/photos', 'POST', photos);
}

export async function updateStorePhotos(adminKey: string, updates: StorePhotoUpdatePayload[]): Promise<void> {
  await send<{ updated: number }>(adminKey, '/photos', 'PATCH', updates);
}

export function deleteStorePhotos(adminKey: string, ids: string[]): Promise<StorePhotoDeleteResponse> {
  return send<StorePhotoDeleteResponse>(adminKey, '/photos', 'DELETE', { ids });
}

export function presignReplace(adminKey: string, id: string, request: StorePhotoReplaceRequest): Promise<StorePresignResponse> {
  return send<StorePresignResponse>(adminKey, `/photos/${encodeURIComponent(id)}/replace`, 'POST', request);
}

export function completeReplace(adminKey: string, id: string, payload: StorePhotoReplaceComplete): Promise<StorePhoto> {
  return send<StorePhoto>(adminKey, `/photos/${encodeURIComponent(id)}/replace`, 'PATCH', payload);
}
