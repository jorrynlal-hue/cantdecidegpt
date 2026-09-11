'use client';

import { Card, CardHeader, Badge, Empty } from '@/components/platform/ui';
import { useSession } from '@/components/platform/SessionProvider';

export default function WorkspacesPage() {
  const { me, switchWorkspace } = useSession();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Workspaces</h1>
        <p className="text-xs text-gray-500 mt-0.5">Switch the active workspace — all data is scoped to it.</p>
      </div>

      <Card>
        <CardHeader title="Your workspaces" />
        {!me?.workspaces?.length ? (
          <Empty title="No workspaces" hint="You are not part of any workspace yet." />
        ) : (
          <div className="divide-y divide-white/5">
            {me.workspaces.map((w: { id: string; name: string; slug: string }) => (
              <div key={w.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{w.name}</p>
                  <p className="text-xs text-gray-500">{w.slug}</p>
                </div>
                {w.id === me.activeWorkspaceId ? (
                  <Badge tone="green">active</Badge>
                ) : (
                  <button
                    onClick={() => switchWorkspace(w.id)}
                    className="rounded-lg border border-purple-500/40 bg-purple-600/20 hover:bg-purple-600 px-3 py-1.5 text-xs font-medium text-purple-200"
                  >
                    Switch here
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}