import { DB, Ctx, Project, Task, KnowledgeItem } from '../types';
import { requireRole, nonEmpty, logActivity } from './core';
import { runProviderLive } from '../providers';
import { createProject, createTask } from './work';
import { createKnowledge } from './docs';
import { SKILLS } from '@/lib/uiol/layer';

// AI employee — describe the help you need in plain words, and the system
// builds a personalised workspace for that exact job using the tools on board.

export const WORKSPACE_CATEGORIES = ['Business', 'Marketing', 'Sales & CRM', 'Customer', 'Finance', 'HR & Hiring', 'Operations', 'Website & Admin', 'Other'];

export interface WorkspaceMilestone {
  title: string;
  description: string;
}

export interface WorkspacePlan {
  name: string;
  category: string;
  tier: 'normal' | '1000' | '1600';
  template: string;
  goal: string;
  tools: string[];
  milestones: WorkspaceMilestone[];
  briefing: string;
}

function titleCase(s: string): string {
  return s
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// Deterministic fallback so the flow always works.
export function fallbackWorkspacePlan(description: string): WorkspacePlan {
  const clean = description.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const name = titleCase(words.slice(0, 5).join(' ')) || 'New AI workplace';

  let category = 'Business';
  const catMap: Array<[RegExp, string]> = [
    [/sale|lead|crm|quot|proposal|client/i, 'Sales & CRM'],
    [/market|campaign|content|social|advert|brand/i, 'Marketing'],
    [/financ|invoice|budget|tax|payroll|payment/i, 'Finance'],
    [/hire|human resource|recruit|team|staff|employee/i, 'HR & Hiring'],
    [/operat|logistic|process|supply|production/i, 'Operations'],
    [/website|site|online shop|store|e-?commerce/i, 'Website & Admin'],
    [/support|customer care|help desk/i, 'Customer'],
  ];
  for (const [re, c] of catMap) {
    if (re.test(clean)) {
      category = c;
      break;
    }
  }

  const skillHits = SKILLS.filter(
    (s) => clean.toLowerCase().includes(s.name) || s.tools.some((t) => clean.toLowerCase().includes(t))
  );
  const tools = Array.from(new Set(skillHits.flatMap((s) => s.tools))).slice(0, 8);

  const sentences = clean.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 1);
  const milestones: WorkspaceMilestone[] = sentences.slice(0, 6).map((s, i) => ({
    title: `Milestone ${i + 1}: ${s.slice(0, 60)}`,
    description: s.slice(0, 400),
  }));
  if (milestones.length === 0) {
    milestones.push({ title: 'Kick off the plan', description: clean.slice(0, 400) });
  }

  return {
    name,
    category,
    tier: 'normal',
    template: 'Blank project',
    goal: clean.slice(0, 500),
    tools,
    milestones,
    briefing: [
      `## What this workspace does`,
      clean,
      ``,
      `## How it is run`,
      `Every milestone becomes a tracked task, the right tools stay one tap away from the radial toolkits, and the AI employee keeps the loop updated as you move.`,
      ``,
      `## Tools at your disposal`,
      tools.length ? tools.map((t) => `- ${t}`).join('\n') : '- the full system toolset',
    ].join('\n'),
  };
}

function extractPlan(rawOutput: string, description: string): WorkspacePlan | null {
  let s = (rawOutput ?? '').trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1];
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (typeof obj !== 'object' || obj === null) return null;
  const milestones = Array.isArray(obj.milestones)
    ? obj.milestones
        .slice(0, 8)
        .map((m) => ({
          title: String((m as { title?: unknown })?.title ?? 'Step').slice(0, 80),
          description: String((m as { description?: unknown })?.description ?? '').slice(0, 500),
        }))
        .filter((m) => m.title.trim())
    : [];
  if (milestones.length === 0) return null;
  const name = String(obj.name ?? '').trim().slice(0, 50) || milestones[0].title.slice(0, 50);
  const category = WORKSPACE_CATEGORIES.includes(String(obj.category ?? '')) ? String(obj.category) : 'Business';
  const tier: 'normal' | '1000' | '1600' = obj.tier === 'pro' || obj.tier === '1000' ? '1000' : 'normal';
  return {
    name,
    category,
    tier,
    template: 'Blank project',
    goal: String(obj.goal ?? description).slice(0, 700),
    tools: Array.isArray(obj.tools) ? obj.tools.map((t) => String(t).trim()).filter(Boolean).slice(0, 9) : [],
    milestones,
    briefing: String(obj.briefing ?? description).slice(0, 3000),
  };
}

const PLAN_PROMPT = (description: string) =>
  `You are the AI hiring manager inside CAN'T DECIDE GPT. You build a personalised workspace for a human who described exactly the kind of help they need. The workspace must use the real tools of the system so the work can actually get done.

REQUEST: ${description}

Return ONLY a single JSON object with EXACTLY these keys:
- "name": a title for the workspace (max 50 chars)
- "category": one of ${WORKSPACE_CATEGORIES.join(' | ')}
- "tier": "pro" or "normal"
- "goal": one crisp sentence describing what the workspace will deliver
- "tools": array of strings naming which system tools the worker will use
- "milestones": array of 4-7 objects with "title" and "description", the concrete steps that complete the request end to end
- "briefing": a short Markdown plan starting with "## Goal"

No commentary, no markdown fences, no extra text. Strict JSON only.`;

export async function generateWorkspaceLive(ctx: Ctx, db: DB, input: { description: string }): Promise<{ plan: WorkspacePlan; provider: string }> {
  requireRole(ctx, 'member');
  const description = nonEmpty(input.description, 'description');
  let plan = fallbackWorkspacePlan(description);
  let provider = 'smart planner (built-in)';
  try {
    const outcome = await runProviderLive(db, ctx.workspaceId, 'content', PLAN_PROMPT(description), { maxTokens: 1600 });
    if (!outcome.isBaseline) provider = outcome.provider;
    const parsed = extractPlan(outcome.output, description);
    if (parsed) plan = parsed;
  } catch {
    // keep the deterministic fallback
  }
  return { plan, provider };
}

// Build the whole thing: workspace project + milestone tasks + briefing.
export async function spawnAIWorkspace(
  ctx: Ctx,
  db: DB,
  input: { description: string; name?: string }
): Promise<{ workspace: Project; tasks: Task[]; briefing: KnowledgeItem; tools: string[]; provider: string }> {
  const { plan, provider } = await generateWorkspaceLive(ctx, db, input);

  const name = (input.name ?? '').trim();
  const workspace = createProject(ctx, db, {
    name: name || plan.name,
    description: plan.goal,
    category: plan.category,
    tier: plan.tier,
    template: plan.template,
    status: 'planning',
  });

  const tasks = plan.milestones.map((m) =>
    createTask(ctx, db, {
      title: m.title,
      description: m.description,
      projectId: workspace.id,
      assigneeId: ctx.user.id,
      priority: 'high',
      status: 'todo',
    })
  );

  const briefing = createKnowledge(ctx, db, {
    title: `AI employee briefing — ${workspace.name}`,
    kind: 'instruction',
    content: [
      `## Built by your AI employee`,
      plan.briefing,
      ``,
      `## Tools chosen`,
      plan.tools.length ? plan.tools.map((t) => `- ${t}`).join('\n') : '- the full system toolset',
      ``,
      `## Milestones set`,
      plan.milestones.map((m, i) => `${i + 1}. ${m.title}`).join('\n'),
      ``,
      `## Provider`,
      provider,
    ].join('\n'),
    tags: [workspace.id, 'ai-worker', 'workspace', 'briefing', 'phase'],
  });

  logActivity(ctx, db, {
    action: 'aiworker.spawn',
    result: `AI employee built workspace "${workspace.name}" with ${tasks.length} tasks via ${provider}`,
    objectType: 'project',
    objectId: workspace.id,
    objectLabel: workspace.name,
  });

  return { workspace, tasks, briefing, tools: plan.tools, provider };
}