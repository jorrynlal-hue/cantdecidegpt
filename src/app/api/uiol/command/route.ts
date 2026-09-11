import { commandCenter } from '@/lib/uiol/engine';

export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ ok: true, command: commandCenter() });
}