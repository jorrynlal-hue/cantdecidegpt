import type { Ctx, DB } from './types';

// Event bus decoupled from the automation engine to avoid module cycles.
// engine modules emit events; automation registers a handler via onEvent().
export type EventHandler = (ctx: Ctx, db: DB, type: string, payload: Record<string, unknown>) => void;

const handlers: EventHandler[] = [];

export function onEvent(h: EventHandler): void {
  if (!handlers.includes(h)) handlers.push(h);
}

export function emitEvent(ctx: Ctx, db: DB, type: string, payload: Record<string, unknown>): void {
  for (const h of handlers) {
    try {
      h(ctx, db, type, payload);
    } catch {
      // event handlers must never break the originating mutation
    }
  }
}