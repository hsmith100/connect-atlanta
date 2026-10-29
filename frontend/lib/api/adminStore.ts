import type { Photographer, PhotographerCreatePayload, PhotographerUpdatePayload } from '@shared/types/store';
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
