import { DB, Execution } from './types';

// Lazily loads automation to avoid module-load cycles (db -> scheduler -> automation -> actions -> engine -> db).
export async function runScheduledSweep(db: DB): Promise<void> {
  const { sweep } = await import('./automation');
  sweep(db);
}