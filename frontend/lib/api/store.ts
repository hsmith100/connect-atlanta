import type { PublicCollection, PublicCollectionPage } from '@shared/types/store';
import { fetchAPI } from './client';

export async function getPublicCollections(): Promise<PublicCollection[]> {
  return (await fetchAPI<{ collections: PublicCollection[] }>('/api/store/collections')).collections;
}

export function getPublicCollectionPage(id: string, cursor?: string | null): Promise<PublicCollectionPage> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return fetchAPI<PublicCollectionPage>(`/api/store/collections/${encodeURIComponent(id)}${qs}`);
}
