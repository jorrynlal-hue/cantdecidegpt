'use client';

import { useState } from 'react';
import { Send, Bell, MessagesSquare } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Field, Empty, Spinner, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Email { id: string; to: string; subject: string; body?: string; status: string; sentAt?: string; createdAt: string; }
interface Template { id: string; name: string; subject: string; body: string; updatedAt: string; }
interface Notification { id: string; title: string; body?: string; kind: string; read: boolean; createdAt: string; }
interface Conversation { id: string; title: string; updatedAt: string; }

export default function ConnectPage() {
  const emails = useCollection<Email>('emails', {});
  const templates = useCollection<Template>('emailTemplates', {});
  const notifications = useCollection<Notification>('notifications', {});
  const conversations = useCollection<Conversation>('conversations', {});
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!to.trim() || !subject.trim()) return;
    setBusy(true);
    try {
      await collection.create('emails', { to: to.trim(), subject, body: body || undefined });
      setTo(''); setSubject(''); setBody('');
      emails.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Connect</h1>
        <p className="text-xs text-gray-500 mt-0.5">Unified communication layer: mail, templates, notifications and conversation threads.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><div className="flex items-center gap-2"><Send className="h-4 w-4 text-amber-300" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Mail sent</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{emails.rows.filter((e) => e.status === 'sent').length}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><span className="text-sm font-bold text-purple-400">◇</span><p className="text-[11px] uppercase tracking-wider text-gray-500">Templates</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{templates.rows.length}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><Bell className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Notifications</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{notifications.rows.length}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><MessagesSquare className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Threads</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{conversations.rows.length}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Compose & Send" sub="Delivery routes through a connected relay (baseline fallback)" right={<Send className="h-4 w-4 text-purple-400" />} />
          <div className="space-y-3 p-4">
            <Field label="To"><Input value={to} onChange={setTo} placeholder="recipient@example.com" /></Field>
            <Field label="Subject"><Input value={subject} onChange={setSubject} placeholder="Subject" /></Field>
            <Field label="Body"><Textarea value={body} onChange={setBody} rows={3} placeholder="Message" /></Field>
            <Btn kind="solid" disabled={busy || !to.trim() || !subject.trim()} onClick={send}>Send message</Btn>
          </div>
        </Card>

        <Card>
          <CardHeader title="Message Outbox" right={<Badge tone="purple">{emails.rows.length}</Badge>} />
          {emails.loading ? (
            <Spinner />
          ) : emails.rows.length === 0 ? (
            <Empty title="No mail yet" />
          ) : (
            <div className="divide-y divide-white/5">
              {emails.rows.slice(0, 10).map((e) => (
                <div key={e.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-gray-100">{e.subject}</p>
                    <Badge tone={e.status === 'sent' ? 'green' : e.status === 'failed' ? 'red' : 'amber'}>{e.status}</Badge>
                  </div>
                  <p className="text-[11px] text-gray-500">to {e.to} · {fmtDate(e.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent Threads & Alerts" right={<Badge tone="purple">{conversations.rows.length + notifications.rows.length}</Badge>} />
        <div className="divide-y divide-white/5">
          {conversations.rows.slice(0, 6).map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="truncate text-sm text-gray-200">{c.title}</span>
              <span className="text-[10px] text-gray-600">{new Date(c.updatedAt).toLocaleString()}</span>
            </div>
          ))}
          {notifications.rows.slice(0, 6).map((n) => (
            <div key={n.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="truncate text-sm text-gray-300">{n.title}</span>
              <Badge tone={n.read ? 'gray' : 'blue'}>{n.read ? 'Read' : 'New'}</Badge>
            </div>
          ))}
          {conversations.rows.length + notifications.rows.length === 0 && <Empty title="No threads yet" />}
        </div>
      </Card>
    </div>
  );
}