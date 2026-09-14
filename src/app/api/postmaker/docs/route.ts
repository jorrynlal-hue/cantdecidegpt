import { ok } from '@/lib/core/api/helpers';
import { knowledgeView, docsDirPath } from '@/lib/postmaker/kb';

export async function GET() {
  const view = await knowledgeView();
  return ok({ docs: view.docs, stats: view.stats, profile: view.profile, docsDir: docsDirPath });
}