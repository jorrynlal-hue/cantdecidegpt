import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import type { LibraryPost } from './types';

const DATA_DIR = path.join(process.cwd(), 'postmaker-data');
const LIB_FILE = path.join(DATA_DIR, 'library.json');

function ensure(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LIB_FILE)) fs.writeFileSync(LIB_FILE, '[]', 'utf8');
}

export function listPosts(): LibraryPost[] {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(LIB_FILE, 'utf8')) as LibraryPost[];
  } catch {
    return [];
  }
}

export function addPost(text: string, meta: LibraryPost['meta']): LibraryPost {
  ensure();
  const posts = listPosts();
  const post: LibraryPost = { id: uuid(), createdAt: Date.now(), text, meta };
  posts.unshift(post);
  fs.writeFileSync(LIB_FILE, JSON.stringify(posts, null, 2), 'utf8');
  return post;
}

export function removePost(id: string): void {
  ensure();
  const posts = listPosts().filter((p) => p.id !== id);
  fs.writeFileSync(LIB_FILE, JSON.stringify(posts, null, 2), 'utf8');
}