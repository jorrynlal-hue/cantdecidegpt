import { ok, readBody } from '@/lib/core/api/helpers';
import { listPosts, addPost, removePost } from '@/lib/postmaker/library';

export async function GET() {
  return ok({ posts: listPosts() });
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const text = String(body.text ?? '').trim();
  if (!text) return ok({ posts: listPosts() });
  const meta = {
    product: String(body.product ?? ''),
    tone: String(body.tone ?? ''),
    hook: String(body.hook ?? ''),
    length: String(body.length ?? 'medium'),
  };
  const post = addPost(text, meta);
  return ok({ post, posts: listPosts() });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (id) removePost(id);
  return ok({ posts: listPosts() });
}