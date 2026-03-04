import { fetchAPI, adminHeaders } from './client';

type Submission = Record<string, unknown>;

export async function getAdminArtists(adminKey: string): Promise<{ artists: Submission[] }> {
  return fetchAPI<{ artists: Submission[] }>('/api/admin/submissions/artists', {
    headers: adminHeaders(adminKey),
  });
}

export async function getAdminSponsors(adminKey: string): Promise<{ sponsors: Submission[] }> {
  return fetchAPI<{ sponsors: Submission[] }>('/api/admin/submissions/sponsors', {
    headers: adminHeaders(adminKey),
  });
}

export async function updateSponsorNotes(adminKey: string, id: string, notes: string): Promise<void> {
  await fetchAPI<{ updated: boolean }>(`/api/admin/submissions/sponsors/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(adminKey),
    body: JSON.stringify({ notes }),
  });
}

export async function getAdminEmailSignups(adminKey: string): Promise<{ signups: Submission[] }> {
  return fetchAPI<{ signups: Submission[] }>('/api/admin/submissions/email-signups', {
    headers: adminHeaders(adminKey),
  });
}
