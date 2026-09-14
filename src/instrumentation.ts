// Runtime scheduler: advances delayed executions, resumes approvals, and fires
// scheduled_time automations on an interval instead of relying only on
// request-time loads. Node runtime only; it is a no-op on Edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return;
  const { loadDB } = await import('./lib/core/db');
  const tick = () => {
    try {
      loadDB();
    } catch {
      // the scheduler must never crash the runtime
    }
  };
  tick();
  if (typeof setInterval === 'function') {
    const everyMs = Math.max(15000, Number(process.env.NEXUS_SWEEP_MS ?? 30000));
    setInterval(tick, everyMs);
  }
}