// Browser-side typed client for the platform API. No server imports.

async function request<T = unknown>(path: string, method: string, body?: unknown): Promise<T> {
  const opts: RequestInit = { method, headers: {} };
  if (body !== undefined) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  let json: unknown = {};
  try {
    json = await res.json();
  } catch {
    // empty body
  }
  const data = json as { ok?: boolean; data?: T; error?: { code?: string; message?: string } };
  if (!res.ok || data.ok === false) {
    throw new Error(data.error?.message ?? data.error?.code ?? `Request failed (${res.status})`);
  }
  return data.data as T;
}

export type Role = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

export interface Me {
  user: { id: string; email: string; name: string; role: Role };
  workspaces: { id: string; name: string; slug: string }[];
  activeWorkspaceId: string | null;
  settings: { userId: string; workspaceId: string; appearance: { theme: string; accent: string; customAccent?: string }; notify: Record<string, boolean> } | null;
  unread?: number;
  members?: { id: string; name: string; email: string; role: Role }[];
}

export const auth = {
  login: (email: string, password: string) => request<Me>('/api/auth/me', 'POST', { email, password }),
  signup: (email: string, password: string, name: string) =>
    request<Me & { needsVerification?: boolean }>('/api/auth/signup', 'POST', { email, password, name }),
  logout: () => request<{ signedOut: boolean }>('/api/auth/me', 'DELETE'),
  me: () => request<Me>('/api/auth/me', 'GET'),
  switchWorkspace: (workspaceId: string) => request<{ activeWorkspaceId: string }>('/api/workspaces/switch', 'POST', { workspaceId }),
};

export const collection = {
  list: (name: string, params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/db/${name}${qs ? `?${qs}` : ''}`, 'GET') as Promise<unknown[]>;
  },
  get: (name: string, id: string) => request(`/api/db/${name}/${id}`, 'GET') as Promise<unknown>,
  create: (name: string, body: unknown) => request(`/api/db/${name}`, 'POST', body) as Promise<unknown>,
  update: (name: string, id: string, body: unknown) => request(`/api/db/${name}/${id}`, 'PATCH', body) as Promise<unknown>,
  remove: (name: string, id: string) => request(`/api/db/${name}/${id}`, 'DELETE') as Promise<unknown>,
};

export const ai = {
  assistantChat: (message: string, conversationId?: string) =>
    request<{ conversation: unknown; reply: string; toolUsed?: string }>('/api/ai/assistant', 'POST', { message, conversationId }),
  conversations: () => request<unknown[]>('/api/ai/assistant', 'GET') as Promise<unknown[]>,
  generate: (kind: string, prompt: string, params?: Record<string, unknown>) =>
    request<{ generation: unknown; outcome: { provider: string; isBaseline: boolean; simulated: boolean; output: string } }>('/api/ai/generate', 'POST', { kind, prompt, params }),
};

export const automation = {
  run: (workflowId: string, payload?: Record<string, unknown>) =>
    request<{ execution: unknown }>('/api/automation/run', 'POST', { workflowId, payload }),
};

export const approvals = {
  decide: (id: string, approved: boolean) => request<{ approval: unknown }>(`/api/approvals/${id}/decide`, 'POST', { approved }),
};

export const notifications = {
  readAll: (id?: string) => request<{ markedRead?: number; notification?: unknown }>(`/api/notifications/read-all${id ? `?id=${id}` : ''}`, 'POST'),
};

export const analytics = {
  get: () => request<{ insights: Record<string, unknown>; notes: { severity: string; text: string }[] }>('/api/analytics', 'GET'),
  activity: () => request<{ activities: unknown[] }>('/api/analytics?scope=activity', 'GET'),
};

export const search = {
  q: (query: string) => request<{ query: string; hits: { type: string; id: string; title: string; subtitle?: string; link: string; score: number }[]; groups: Record<string, unknown[]> }>(`/api/search?q=${encodeURIComponent(query)}`, 'GET'),
};

export const uploads = {
  file: (file: File, folder?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (folder) form.append('folder', folder);
    return fetch('/api/upload', { method: 'POST', body: form }).then((res) => res.json() as Promise<{ ok?: boolean; data?: unknown; error?: { message?: string } }>);
  },
  text: (payload: { name: string; text?: string; kind?: string; folder?: string; size?: number }) =>
    request<{ document: unknown }>('/api/upload', 'POST', payload),
};

export const integrations = {
  connect: (id: string, settings?: Record<string, unknown>) => request<{ integration: unknown }>(`/api/integrations/${id}/connect`, 'POST', { settings }),
  disconnect: (id: string) => request<{ integration: unknown }>(`/api/integrations/${id}/disconnect`, 'POST'),
};

export const appearance = {
  update: (patch: { theme?: string; accent?: string; customAccent?: string }) =>
    request<{ settings: { appearance: { theme: string; accent: string; customAccent?: string } } }>('/api/appearance', 'PATCH', patch),
};

export type { SitePlan, PlanSpecials } from '@/lib/plans';

export const plans = {
  list: () => request<{ plans: import('@/lib/plans').SitePlan[]; active: string }>('/api/plans', 'GET'),
  select: (planId: string) => request<{ active: string }>('/api/plans/select', 'POST', { planId }),
};

export const payments = {
  createOrder: (planId: string, amount: string) =>
    request<{ orderId: string; approveLink: string; planId: string }>('/api/payments/paypal/create-order', 'POST', { planId, amount }),
  capture: (orderId: string, planId: string) =>
    request<{ status: string; captureId: string; planId: string; payerId?: string }>('/api/payments/paypal/capture', 'POST', { orderId, planId }),
};

export interface HumanView {
  id: string;
  name: string;
  role: string;
  email?: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  focus: string;
  skills: string[];
  aiAssist: string[];
  lastSeen: string;
}

export interface InsightView {
  id: string;
  title: string;
  body: string;
  source: 'ai' | 'human' | 'co';
  tags: string[];
  provider?: string;
  createdAt: string;
}

export const humans = {
  list: () => collection.list('humans') as Promise<HumanView[]>,
  add: (input: {
    name: string;
    role: string;
    email?: string;
    status?: HumanView['status'];
    focus?: string;
    skills?: string[];
    aiAssist?: string[];
  }) => collection.create('humans', input) as Promise<HumanView>,
  update: (id: string, patch: Partial<HumanView>) => collection.update('humans', id, patch) as Promise<HumanView>,
  remove: (id: string) => collection.remove('humans', id),
};

export const insights = {
  list: (source?: string) =>
    collection.list('insights', source ? { source } : {}) as Promise<InsightView[]>,
  set: (input: { title: string; body: string; source?: InsightView['source']; tags?: string[] }) =>
    collection.create('insights', input) as Promise<InsightView>,
  generate: (input?: { prompt?: string; focus?: string; hangingQuestion?: string }) =>
    request<{ insight: InsightView }>('/api/insights/generate', 'POST', input ?? {}),
  remove: (id: string) => collection.remove('insights', id),
};

export const team = {
  users: () => request<{ id: string; name: string; email: string; role: Role }[]>('/api/team/users', 'GET'),
  create: (input: { email: string; name: string; password?: string; role?: Role }) =>
    request<{ user: { id: string; name: string; email: string; role: Role } }>('/api/team/users', 'POST', input),
};