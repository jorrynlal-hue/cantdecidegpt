'use client';

import { CheckCheck } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Empty, Spinner, fmtDateTime } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';

interface Notification { id: string; title: string; body?: string; kind: string; read: boolean; link?: string; createdAt: string; }

const kindTone = (k: string) => (k === 'approval' ? 'amber' : k === 'error' ? 'red' : k === 'success' ? 'green' : k === 'mention' ? 'blue' : 'gray') as 'amber' | 'red' | 'green' | 'blue' | 'gray';

export default function NotificationsPage() {
  const notifs = useCollection<Notification>('notifications', {});

  const markAll = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      notifs.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const markOne = async (id: string) => {
    try {
      await fetch(`/api/db/notifications/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'read' }),
      });
      notifs.reload();
    } catch {
      /* ignore */
    }
  };

  const unread = notifs.rows.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Notifications</h1>
          <p className="text-xs text-gray-500 mt-0.5">{unread} unread</p>
        </div>
        <Btn kind="outline" onClick={markAll} disabled={unread === 0}><CheckCheck className="w-3.5 h-3.5" /> Mark all read</Btn>
      </div>

      <Card>
        {notifs.loading ? <Spinner label="Loading notifications..." /> : notifs.rows.length === 0 ? (
          <Empty title="No notifications yet" hint="They appear when things happen in your workspace — new tasks, approvals, execution failures, mentions." />
        ) : (
          <div className="divide-y divide-white/5">
            {notifs.rows.map((n) => (
              <div key={n.id} onClick={() => !n.read && markOne(n.id)} className={`px-4 py-3 cursor-pointer hover:bg-white/5 ${n.read ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white flex items-center gap-2">
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />}
                      {n.title}
                    </p>
                    {n.body ? <p className="text-xs text-gray-500 mt-0.5">{n.body}</p> : null}
                    <p className="text-[10px] text-gray-600 mt-0.5">{fmtDateTime(n.createdAt)}</p>
                  </div>
                  <Badge tone={kindTone(n.kind)}>{n.kind}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}