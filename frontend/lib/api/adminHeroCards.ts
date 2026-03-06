import type { HeroCard } from '@shared/types/heroCards';
import { fetchAPI, adminHeaders } from './client';

export async function getHeroCards(): Promise<HeroCard[]> {
  return fetchAPI<HeroCard[]>('/api/hero-cards');
}

export async function getAdminHeroCards(adminKey: string): Promise<HeroCard[]> {
  return fetchAPI<HeroCard[]>('/api/admin/hero-cards', {
    headers: adminHeaders(adminKey),
  });
}

export async function createHeroCard(
  adminKey: string,
  card: { id: string; title: string; description: string; ctaText: string; linkUrl: string; imageUrl?: string; icon?: string; sortOrder: number; visible: boolean },
): Promise<void> {
  await fetchAPI<{ created: boolean }>('/api/admin/hero-cards', {
    method: 'POST',
    headers: adminHeaders(adminKey),
    body: JSON.stringify(card),
  });
}

export async function updateHeroCard(
  adminKey: string,
  id: string,
  updates: Partial<Omit<HeroCard, 'id' | 'entity'>>,
): Promise<void> {
  await fetchAPI<{ updated: boolean }>(`/api/admin/hero-cards/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(adminKey),
    body: JSON.stringify(updates),
  });
}

export async function deleteHeroCard(adminKey: string, id: string): Promise<void> {
  await fetchAPI<{ deleted: boolean }>(`/api/admin/hero-cards/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(adminKey),
  });
}

export async function presignHeroCardImage(
  adminKey: string,
  cardId: string,
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; imageUrl: string }> {
  return fetchAPI<{ uploadUrl: string; imageUrl: string }>('/api/admin/hero-cards/presign', {
    method: 'POST',
    headers: adminHeaders(adminKey),
    body: JSON.stringify({ cardId, filename, contentType }),
  });
}
