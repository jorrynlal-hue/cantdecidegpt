import { requireSession, ok, fromError } from '@/lib/core/api/helpers';
import { listBackups } from '@/lib/core/supabase';

export async function GET() {
  try {
    await requireSession();
    const backups = await listBackups(20);
    return ok(backups);
  } catch (e) {
    return fromError(e);
  }
}