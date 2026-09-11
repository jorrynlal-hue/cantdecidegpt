import { v4 as uuidv4 } from 'uuid';
import { Message, Chat } from '@/types';

export const generateId = (): string => uuidv4();

export const createMessage = (role: 'user' | 'assistant', content: string): Message => ({
  id: generateId(),
  role,
  content,
  timestamp: new Date(),
});

export const createChat = (title?: string): Chat => ({
  id: generateId(),
  title: title || 'New Chat',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const cn = (...classes: (string | boolean | undefined | null)[]): string =>
  classes.filter(Boolean).join(' ');

export const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

export const truncate = (str: string, maxLength: number): string =>
  str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
