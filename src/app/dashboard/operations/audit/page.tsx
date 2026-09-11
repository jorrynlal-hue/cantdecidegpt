'use client';

import { useEffect, useState } from 'react';
import { ScrollText, Download, Loader2 } from 'lucide-react';
import { api, eventItem, WorkItem } from '@/lib/uiol/client';
import { ActorLabel } from '@/components/uiol/badges';

export default function AuditPage() {
  const [events, setEvents] = useState<eventItem[]>([]);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [aud, wl] = await Promise.all([api.audit({ workitem_id: filter || undefined, limit: 500 }), api.workitems()]);
        if (!active) return;
        setEvents(aud.events);
        setTotal(aud.total);
        setItems(wl.items);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [filter]);

  const exportJson = () => {
    const payload = { exported_at: new Date().toISOString(), filter: filter || 'all', events };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uiol-audit-${filter || 'all'}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><ScrollText className="h-6 w-6 text-purple-400" /> Audit Ledger</h1>
          <p className="mt-1 text-sm text-gray-400">Append-only operational history. Every identity, permission decision, and outcome is inspectable and exportable.</p>
        </div>
        <button onClick={exportJson} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#12121a] px-4 py-2 text-sm text-gray-200 hover:bg-white/5">
          <Download className="h-4 w-4" /> Export {events.length} events
        </button>
      </div>

      {total > events.length && (
        <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-400">Showing {events.length} of {total} total events (append-only). Export for the complete ledger.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter('')} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${!filter ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>All items</button>
        {items.slice(0, 12).map((i) => (
          <button key={i.id} onClick={() => setFilter(filter === i.id ? '' : i.id)} className={`rounded-lg px-3 py-1.5 font-mono text-xs ${filter === i.id ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{i.id}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading ledger…</div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-16 text-center text-gray-500">No audit events recorded yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#16161f] text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">WorkItem</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Transition</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Time (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.map((ev) => (
                <tr key={ev.id} className="align-top hover:bg-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-purple-400">{ev.workitem_id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-300">{ev.action}</td>
                  <td className="px-4 py-3"><ActorLabel actor={ev.actor} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{ev.from || '—'} → {ev.to || '—'}</td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-xs text-gray-500" title={ev.details}>{ev.details}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{new Date(ev.at).toISOString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}