// Safety-net cleanup that runs after all tests finish, regardless of pass/fail.
// Deletes any test data that leaked through (e.g. test failed before UI delete).
// No-ops silently when ADMIN_KEY is absent.

import fs from 'fs';
import path from 'path';
import { deleteTestEvents, deleteTestHeroCards, deletePhotosById } from './helpers/admin-api';

const PHOTO_STATE_FILE = path.join(__dirname, '.test-state', 'photo-ids.json');

export default async function globalTeardown(): Promise<void> {
  if (!process.env.ADMIN_KEY) return;

  await Promise.allSettled([
    deleteTestEvents(),
    deleteTestHeroCards(),
    (async () => {
      if (!fs.existsSync(PHOTO_STATE_FILE)) return;
      const ids: string[] = JSON.parse(fs.readFileSync(PHOTO_STATE_FILE, 'utf-8'));
      await deletePhotosById(ids);
      fs.unlinkSync(PHOTO_STATE_FILE);
    })(),
  ]);
}
