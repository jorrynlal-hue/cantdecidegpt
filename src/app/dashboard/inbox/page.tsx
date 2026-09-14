'use client';

import { useState } from 'react';
import { Reply } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Empty, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';
import { AIMemo } from '@/components/platform/AIMemo';

interface Email {
  id: string; to?: string; subject: string; body: string; status: string; scheduledAt?: string; createdAt: string;
}

const statusTone = (s: string): 'gray' | 'blue' | 'green' | 'red' =>
  s === 'sent' ? 'green' : s === 'draft' ? 'blue' : s === 'failed' ? 'red' : 'gray';

export default function InboxPage() {
  const emails = useCollection<Email>('emails');
  const [sel, setSel] = useState<Email | null>(null);

  const drafts = emails.rows.filter((e) => e.status === 'draft').length;
  const sent = emails.rows.filter((e) => e.status === 'sent').length;

  const select = (e: Email) => setSel(e.id === sel?.id ? null : e);

  const context = sel
    ? `Email to reply to:\nSubject: ${sel.subject}\nTo: ${sel.to ?? '—'}\nPrevious thread:\n${sel.body.slice(0, 1200)}\n\nDraft the reply.`
    : '';

  const saveDraft = async (output: string) => {
    if (!sel) return;
    await collection.create('emails', { to: sel.to, subject: `Re: ${sel.subject}`, body: output, status: 'draft' });
    emails.reload();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Inbox</h1>
        <p className="text-xs text-gray-500 mt-0.5">Triage, prioritize and auto-draft replies — inbox zero, on your terms.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Sent" value={sent} tone="good" />
        <Stat label="Drafts" value={drafts} tone="warn" />
        <Stat label="Total outbox" value={emails.rows.length} />
      </div>

      <Card>
        <CardHeader title="Mail" right={<Badge tone="purple">{emails.rows.length} messages</Badge>} />
        {emails.loading ? (
          <Spinner label="Opening the inbox..." />
        ) : emails.rows.length === 0 ? (
          <Empty title="Inbox empty" hint="Create campaigns in Marketing to generate emails, then draft replies here." />
        ) : (
          <ul className="divide-y divide-white/5">
            {emails.rows.slice(-15).reverse().map((e) => (
              <li
                key={e.id}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors ${sel?.id === e.id ? 'bg-sky-500/10' : 'hover:bg-white/5'}`}
                onClick={() => select(e)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-100">{e.subject}</p>
                  <p className="truncate text-[10px] text-gray-500">{e.to ?? 'no recipient'} · {e.body.slice(0, 60)}</p>
                </div>
                <Badge tone={statusTone(e.status)}>{e.status}</Badge>
                {sel?.id !== e.id && (
                  <Btn small kind="ghost" onClick={() => select(e)}>
                    <Reply className="h-3 w-3" /> Reply
                  </Btn>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {sel ? (
        <AIMemo
          toolId="inbox"
          title="Draft Reply"
          sub={`Replying to "${sel.subject}"`}
          placeholder="e.g. Reply warmly, confirm the date, and ask about the invoice."
          context={context}
          prompt={(input, ctx) =>
            `You are Inbox for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\nInstruction: ${input}\n\nDraft the reply. Match the tone of the thread, keep it under 150 words, and make clear exactly what you are confirming or asking.`
          }
          saveTitle={() => `Re: ${sel.subject}`}
          saveLabel="Save as email draft"
          onSave={saveDraft}
        />
      ) : (
        <Card>
          <CardHeader title="Reply triage" right={<Badge tone="gray">waiting</Badge>} />
          <Empty title="Select a message" hint="Click a message above to draft a reply to it." />
        </Card>
      )}
    </div>
  );
}