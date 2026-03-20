// Global setup for admin tests.
// Validates the ADMIN_KEY against the live API and writes a Playwright storageState
// file with localStorage pre-populated so tests skip the AuthGate UI.
// Runs before all test projects. Safe to run without ADMIN_KEY — it no-ops when
// the key is absent (e.g. during smoke-only runs).

import fs from 'fs';
import path from 'path';

export default async function adminSetup(): Promise<void> {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return;

  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/admin/photos`, {
    headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`ADMIN_KEY validation failed: HTTP ${res.status}. Check the ADMIN_KEY env var.`);
  }

  // Write storageState with connect_admin_key pre-set in localStorage so the
  // admin page auto-authenticates without showing the AuthGate.
  const origin = new URL(baseUrl).origin;
  const storageState = {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [{ name: 'connect_admin_key', value: adminKey }],
      },
    ],
  };

  const authDir = path.join(__dirname, '.auth');
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(path.join(authDir, 'admin.json'), JSON.stringify(storageState));
}
