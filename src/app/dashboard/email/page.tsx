'use client';

import { useState } from 'react';
import { Send, Inbox, RotateCcw, Trash2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Field, Empty, Spinner, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface EmailRow { id: string; to: string; subject: string; body?: string; status: string; sentAt?: string; createdAt: string; }
interface Template { id: string; name: string; subject: string; body: string; updatedAt: string; }

const statusTone = (s: string) => (s === 'sent' ? 'green' : s === 'failed' ? 'red' : 'amber') as 'green' | 'red' | 'amber';

export default function EmailPage() {
  const emails = useCollection<EmailRow>('emails', {});
  const templates = useCollection<Template>('emailTemplates', {});
  const [tab, setTab] = useState<'inbox' | 'compose' | 'templates'>('inbox');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const [tName, setTName] = useState('');
  const [tSubject, setTSubject] = useState('');
  const [tBody, setTBody] = useState('');

  const send = async () => {
    if (!to.trim() || !subject.trim()) return;
    setBusy(true);
    try {
      await collection.create('emails', { to: to.trim(), subject, body: body || undefined });
      setTo(''); setSubject(''); setBody('');
      setTab('inbox');
      emails.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendWithTemplate = async (t: Template) => {
    setTab('compose');
    setSubject(t.subject);
    setBody(t.body);
  };

  const saveTemplate = async () => {
    if (!tName.trim()) return;
    try {
      await collection.create('emailTemplates', { name: tName, subject: tSubject, body: tBody });
      setTName(''); setTSubject(''); setTBody('');
      templates.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Email</h1>
          <p className="text-xs text-gray-500 mt-0.5">Compose and send. Delivery routes through a connected integration (or the baseline relay).</p>
        </div>
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          {(['inbox', 'compose', 'templates'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium capitalize ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t === 'inbox' ? <Inbox className="w-3.5 h-3.5" /> : t === 'compose' ? <Send className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'inbox' && (
        <Card>
          <CardHeader title="Outbox" sub="Emails created in this workspace" />
          {emails.loading ? <Spinner /> : emails.rows.length === 0 ? (
            <Empty title="No emails yet" hint="Compose an email and it will appear here with delivery status." />
          ) : (
            <div className="divide-y divide-white/5">
              {emails.rows.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate"><span className="text-gray-500 text-xs">to </span>{e.to}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{e.subject}{e.body ? ` — ${e.body}` : ''}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{fmtDate(e.createdAt)}</p>
                  </div>
                  <Badge tone={statusTone(e.status)}>{e.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'compose' && (
        <Card className="max-w-xl">
          <CardHeader title="Compose" sub="A subject + body email; people to recipient" />
          <div className="p-4 space-y-3">
            <Field label="To"><Input value={to} onChange={setTo} placeholder="name@example.com" /></Field>
            <Field label="Subject"><Input value={subject} onChange={setSubject} /></Field>
            <Field label="Body"><Textarea value={body} onChange={setBody} rows={8} /></Field>
            <div className="flex items-center justify-end gap-2">
              <div className="flex flex-wrap gap-1 mr-auto">
                {templates.rows.slice(0, 3).map((t) => (
                  <button key={t.id} onClick={() => sendWithTemplate(t)} title={t.name} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-gray-400 hover:text-white">{t.name}</button>
                ))}
              </div>
              <Btn onClick={send} disabled={busy || !to.trim() || !subject.trim()}>
                <Send className="w-3.5 h-3.5" /> Send
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {tab === 'templates' && (
        <div className="grid gap-3">
          <Card className="p-4 max-w-xl">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-3">Save a template</p>
            <div className="space-y-3">
              <Field label="Name"><Input value={tName} onChange={setTName} /></Field>
              <Field label="Subject"><Input value={tSubject} onChange={setTSubject} /></Field>
              <Field label="Body"><Textarea value={tBody} onChange={setTBody} rows={4} /></Field>
              <Btn onClick={saveTemplate} disabled={!tName.trim()}>Save template</Btn>
            </div>
          </Card>
          {templates.rows.map((t) => (
            <Card key={t.id} className="p-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.subject} — {t.body}</p>
              </div>
              <Btn kind="ghost" small onClick={() => sendWithTemplate(t)}>Use</Btn>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}