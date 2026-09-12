'use client';

import Link from 'next/link';
import { Search, Workflow, BellRing, HelpCircle, MousePointerClick, Undo2, Trash2, X } from 'lucide-react';
import { Card, CardHeader, Badge } from '@/components/platform/ui';

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], what: 'Open workspace search from anywhere' },
  { keys: ['Ctrl', 'Z'], what: 'Undo on the workflow canvas' },
  { keys: ['Ctrl', 'Shift', 'Z'], what: 'Redo on the workflow canvas' },
  { keys: ['Ctrl', 'Y'], what: 'Redo (Windows alternative)' },
  { keys: ['Delete'], what: 'Remove the selected canvas node' },
  { keys: ['Enter'], what: 'Open the top search result' },
  { keys: ['Esc'], what: 'Close dialogs, palettes and menus' },
];

const LINKS = [
  { label: 'Workflow Builder', href: '/dashboard/workspace', icon: Workflow, desc: 'Drag nodes, connect them with curves, save and restore your canvas.' },
  { label: 'Attention Required', href: '/dashboard/attention', icon: BellRing, desc: 'Approvals, failed runs and overdue tasks — with the ting · ting · ting alert rules.' },
  { label: 'Audio and Notifications', href: '/dashboard/settings', icon: BellRing, desc: 'Mute, volume, quiet hours and browser notifications.' },
  { label: 'System Health', href: '/dashboard/trust', icon: HelpCircle, desc: 'Trust Center, policy, audit ledger and metrics.' },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-lg font-bold text-white">Help and Keyboard Shortcuts</h1>
        <p className="mt-0.5 text-xs text-gray-500">
          How to move around CAN&apos;T DECIDE GPT, and the shortcuts that actually work today.
        </p>
      </div>

      <Card>
        <CardHeader title="Keyboard shortcuts" right={<Badge tone="gray">live</Badge>} sub="These map to real behaviour — search palette, canvas undo/redo and node deletion." />
        <div className="p-4">
          <div className="space-y-2">
            {SHORTCUTS.map((s) => (
              <div key={s.what} className="flex items-center gap-3">
                <span className="flex shrink-0 items-center gap-1">
                  {s.keys.map((k) => (
                    <kbd key={k} className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-gray-200">
                      {k}
                    </kbd>
                  ))}
                </span>
                <span className="text-xs text-gray-400">{s.what}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Canvas gestures" right={<Badge tone="blue">Workflow Builder</Badge>} />
        <div className="grid gap-2 p-4 sm:grid-cols-2">
          {[
            { icon: MousePointerClick, t: 'Drag nodes', d: 'Grab any node card and move it. The grid snap toggle keeps it tidy.' },
            { icon: Workflow, t: 'Connect', d: 'Click the purple port on one node, then the cyan port on another.' },
            { icon: Undo2, t: 'Zoom & pan', d: 'Scroll to zoom, drag empty space to pan, Fit to frame everything.' },
            { icon: Search, t: 'Search & filter', d: 'Search in the toolkit rail to find and add nodes fast.' },
            { icon: BellRing, t: 'Status colors', d: 'Green = completed, amber = warning, red = failed, blue = running.' },
            { icon: Trash2, t: 'Remove', d: 'Preselect a node, then Delete, or use the duplicate tool in the inspector.' },
            { icon: X, t: 'Disconnect', d: 'Select a node to see its links and remove them in the inspector.' },
            { icon: HelpCircle, t: 'Save', d: 'The canvas autosaves and you can Save / Restore it explicitly.' },
          ].map((g) => (
            <div key={g.t} className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <g.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#19C9D6]" />
              <span>
                <span className="block text-xs font-semibold text-gray-100">{g.t}</span>
                <span className="block text-[10px] leading-relaxed text-gray-500">{g.d}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Common destinations" />
        <div className="grid gap-2 p-4 sm:grid-cols-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 hover:border-white/20 hover:bg-white/[0.06]">
              <l.icon className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
              <span>
                <span className="block text-xs font-semibold text-gray-100">{l.label}</span>
                <span className="block text-[10px] leading-relaxed text-gray-500">{l.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}