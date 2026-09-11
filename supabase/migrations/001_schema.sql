-- ===========================================================================
-- Can't Decide GPT — Supabase schema (run in Supabase SQL editor)
-- One migration creating every domain table + RLS + app_state backups.
-- ===========================================================================

-- app_state: latest full snapshot of the operating system (single row)
create table if not exists public.app_state (
  id text primary key default 'latest',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- app_backups: git-style versioned saves (each real save becomes a snapshot).
-- Rows are written from the server using the service_role key.
create table if not exists public.app_backups (
  id uuid primary key default gen_random_uuid(),
  version bigint not null,
  message text,
  author text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- users: auth-level entries mirroring the app's User records.
create table if not exists public.users (
  id text primary key,
  email text unique not null,
  password_hash text not null,
  name text not null,
  role text not null default 'member',
  avatar text,
  created_at timestamptz not null default now()
);

-- workspaces
create table if not exists public.workspaces (
  id text primary key,
  name text not null,
  slug text not null,
  owner_user_id text not null,
  member_ids jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- humans (the operating system's people)
create table if not exists public.humans (
  id text primary key,
  workspace_id text not null,
  name text not null,
  role text not null,
  email text,
  status text not null default 'offline',
  focus text,
  skills jsonb not null default '[]'::jsonb,
  ai_assist jsonb not null default '[]'::jsonb,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- insights (generative thinking board)
create table if not exists public.insights (
  id text primary key,
  workspace_id text not null,
  title text not null,
  body text not null,
  source text not null default 'human',
  tags jsonb not null default '[]'::jsonb,
  generated_by text,
  provider text,
  created_at timestamptz not null default now()
);

-- payments (PayPal captures)
create table if not exists public.payments (
  id text primary key,
  workspace_id text not null,
  plan_id text not null,
  amount numeric not null,
  currency text not null default 'USD',
  provider text not null default 'paypal',
  provider_ref text,
  status text not null default 'completed',
  created_by text,
  created_at timestamptz not null default now()
);

-- RLS: app_state public read for anon, writes are service-role only (off by default)
alter table public.app_state enable row level security;
alter table public.app_backups enable row level security;
alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.humans enable row level security;
alter table public.insights enable row level security;
alter table public.payments enable row level security;

-- Everyone can read what the app publishes (the app authorizes on its own).
create policy "app_state_anon_read" on public.app_state for select using (true);
create policy "app_backups_anon_read" on public.app_backups for select using (true);
create policy "payments_anon_read" on public.payments for select using (true);

-- Service-role writes use the service_role key in the server; no anon write policies.

create index if not exists idx_humans_ws on public.humans (workspace_id);
create index if not exists idx_insights_ws on public.insights (workspace_id);
create index if not exists idx_payments_ws on public.payments (workspace_id);
create index if not exists idx_backups_created on public.app_backups (created_at desc);