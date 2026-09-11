'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, Badge, Spinner, fmtDateTime } from '@/components/platform/ui';
import { analytics } from '@/lib/core/client';

interface Activity { id: string; actorSource: string; action: string; result: string; objectType?: string; objectLabel?: string; at: string; }

export default function ActivityPage() {
  const [rows, setRows] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analytics.activity().then((d) => setRows((d.activities as Activity[]) ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Activity</h1>
        <p className="text-xs text-gray-500 mt-0.5">Every action in this workspace — by people, the assistant, and automation.</p>
      </div>
      <Card>
        {loading ? <Spinner label="Loading activity..." /> : rows.length === 0 ? (
          <p className="p-8 text-center text-xs text-gray-600">No activity yet.</p>
        ) : (
          <div className="divide-y divide-white/5 max-h-[70vh] overflow-y-auto">
            {rows.map((a) => (
              <div key={a.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-300">{a.result}</p>
                  <Badge tone={a.actorSource.includes('automation') ? 'purple' : a.actorSource.startsWith('ai') ? 'blue' : 'gray'}>{a.actorSource}</Badge>
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">{a.action}{a.objectLabel ? ` · ${a.objectLabel}` : ''} · {fmtDateTime(a.at)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}