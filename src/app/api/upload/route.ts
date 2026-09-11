import { requireSession, ok, fail, fromError } from '@/lib/core/api/helpers';
import { createDocument } from '@/lib/core/engine/docs';

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      const folder = String(form.get('folder') ?? '');
      if (!(file instanceof File)) return fail('BAD_REQUEST', 'Expected a file upload.');
      const name = file.name || 'upload';
      const bytes = await file.arrayBuffer();
      const size = bytes.byteLength;
      const ext = name.split('.').pop()?.toLowerCase() ?? 'bin';
      let text: string | undefined;
      if (['txt', 'md', 'markdown', 'csv', 'json', 'eml', 'html'].includes(ext)) {
        text = new TextDecoder('utf-8').decode(bytes).slice(0, 200000);
      }
      const doc = createDocument(ctx, db, { name, kind: ext, size, text, folder: folder || undefined });
      return ok({ document: doc }, 201);
    }
    const body = await req.json().catch(() => ({}));
    const doc = createDocument(ctx, db, {
      name: String(body.name ?? 'untitled'),
      kind: String(body.kind ?? 'txt'),
      text: body.text ? String(body.text) : undefined,
      folder: body.folder ? String(body.folder) : undefined,
      size: Number(body.size ?? 0),
    });
    return ok({ document: doc }, 201);
  } catch (e) {
    return fromError(e);
  }
}