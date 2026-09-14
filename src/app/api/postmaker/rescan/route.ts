import { ok } from '@/lib/core/api/helpers';
import { rescanKb } from '@/lib/postmaker/kb';

export async function POST() {
  const docs = await rescanKb();
  return ok({ docs: docs.map((d) => ({ name: d.name, ext: d.ext, size: d.size, chars: d.chars, status: d.status })) });
}