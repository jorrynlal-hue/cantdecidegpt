import { NextResponse } from "next/server";
import { loadDB } from "@/lib/core/db";
import { handleEvent } from "@/lib/core/automation";
import type { Ctx, Workflow } from "@/lib/core/types";

// Inbound webhook trigger: POST to /api/webhooks/<secret>. The secret is the
// workflow's webhookSecret (generated per webhook-triggered automation and
// surfaced in the automation page). The request is a capability URL, so it is
// the only thing an external service needs to fire the automation.
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const db = loadDB();
    const wf = db.workflows.find((w) => w.enabled && w.trigger.type === 'webhook' && w.webhookSecret === token);
    if (!wf) {
      return NextResponse.json({ success: false, error: "Invalid or unknown webhook token." }, { status: 404 });
    }
    const creator = db.users.find((u) => u.id === wf.createdBy) ?? db.users.find((u) => u.role === 'owner');
    if (!creator) {
      return NextResponse.json({ success: false, error: "No user context for this workspace." }, { status: 500 });
    }
    const payload: Record<string, unknown> = {};
    try {
      const body = await request.json();
      if (body && typeof body === 'object') Object.assign(payload, body);
    } catch {
      // non-JSON bodies are allowed; payload stays minimal
    }
    const ctx: Ctx = {
      user: { id: creator.id, email: creator.email, name: creator.name, role: creator.role },
      workspaceId: wf.workspaceId,
      actorSource: 'webhook',
      actorLabel: `Webhook → ${wf.name}`,
    };
    payload.webhookWorkflowId = wf.id;
    payload.webhookName = wf.name;
    handleEvent(ctx, db, 'webhook', payload);
    return NextResponse.json({ success: true, data: `Webhook fired "${wf.name}".` });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, ctx: { params: Promise<{ token: string }> }) {
  return requireWorkflow(ctx).then((wf) =>
    NextResponse.json({ success: true, data: { workflow: wf.name, trigger: 'webhook', expects: 'POST JSON payload → runs automation steps' } })
  ).catch(() => NextResponse.json({ success: false, error: "Invalid webhook token." }, { status: 404 }));
}

async function requireWorkflow({ params }: { params: Promise<{ token: string }> }): Promise<Workflow> {
  const { token } = await params;
  const db = loadDB();
  const wf = db.workflows.find((w) => w.trigger.type === 'webhook' && w.webhookSecret === token);
  if (!wf) throw Error('NOT_FOUND');
  return wf;
}