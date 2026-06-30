-- Privacy-preserving progress analytics.
--
-- Records ONLY how far users get, never what they wrote. Each row carries a
-- generic stage id (e.g. "comms", "risk" — the same labels baked into the app)
-- and an index, plus the event type. No plan content, names, or free text ever
-- lands here, so reading this table reveals nothing sensitive about any org.
--
-- Run in the Supabase SQL editor (idempotent). Safe to re-run.

create table if not exists public.progress_events (
  id uuid primary key default gen_random_uuid(),
  -- Defaults to the caller's auth id, same pattern as projects.owner_id.
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  -- Plain uuid (no FK) so this append-only log is fully decoupled from the
  -- projects lifecycle: deleting a project never erases its funnel history,
  -- and logging never fails if the project row hasn't synced yet.
  project_id uuid,
  event text not null,          -- e.g. 'stage_completed'
  stage_id text,                -- generic stage key, e.g. 'comms'
  stage_idx int,                -- the stage's position in the flow
  created_at timestamptz not null default now()
);

alter table public.progress_events enable row level security;

-- Users may record only their OWN events. There is deliberately NO select
-- policy, so the app (and every signed-in user) is blocked from reading the
-- table; you read it with the service role in the SQL editor / dashboard.
drop policy if exists "progress_insert" on public.progress_events;
create policy "progress_insert" on public.progress_events for insert to authenticated
  with check (user_id = auth.uid());

create index if not exists progress_events_user_idx on public.progress_events (user_id);
create index if not exists progress_events_created_idx on public.progress_events (created_at);
