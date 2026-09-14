import { ok } from '@/lib/core/api/helpers';
import { knowledgeView } from '@/lib/postmaker/kb';

export async function GET() {
  const view = await knowledgeView();
  return ok(view);
}