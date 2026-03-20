// Direct HTTP wrappers for the admin API.
// Used in global setup/teardown where no browser is available.
// Reads BASE_URL and ADMIN_KEY from environment.

const baseUrl = () => process.env.BASE_URL ?? 'http://localhost:3000';
const adminKey = () => process.env.ADMIN_KEY ?? '';

async function adminFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey(),
      ...(options.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    console.warn(`[admin-api] ${options.method ?? 'GET'} ${path} → ${res.status}`);
    return null;
  }
  return res.json();
}

export async function deleteTestEvents(): Promise<void> {
  const events = (await adminFetch('/api/admin/events')) as Array<{ id: string; title: string }> | null;
  if (!events) return;
  for (const ev of events.filter((e) => e.title?.includes('E2E Test'))) {
    await adminFetch(`/api/admin/events/${ev.id}`, { method: 'DELETE' });
  }
}

export async function deleteTestHeroCards(): Promise<void> {
  const cards = (await adminFetch('/api/admin/hero-cards')) as Array<{ id: string; title: string }> | null;
  if (!cards) return;
  for (const card of cards.filter((c) => c.title?.includes('E2E'))) {
    await adminFetch(`/api/admin/hero-cards/${card.id}`, { method: 'DELETE' });
  }
}

export async function deletePhotosById(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await adminFetch('/api/admin/photos', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
}
