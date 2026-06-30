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

-- ---------------------------------------------------------------------------
-- FUNNEL QUERIES (run these as needed in the SQL editor; service role bypasses
-- RLS so you see all users). They read only progress metadata + the projects
-- table's stage columns, never plan content.
-- ---------------------------------------------------------------------------

-- 1. Furthest stage reached per user (across all their projects).
--    select user_id, max(stage_idx) as furthest_idx, count(*) as stages_completed
--    from public.progress_events where event = 'stage_completed'
--    group by user_id order by furthest_idx desc;

-- 2. Drop-off funnel: how many distinct users completed each stage.
--    select stage_idx, stage_id, count(distinct user_id) as users_completed
--    from public.progress_events where event = 'stage_completed'
--    group by stage_idx, stage_id order by stage_idx;

-- 3. Current furthest stage per PROJECT straight from the projects table
--    (no event log needed; shows people who created a project but completed nothing):
--    select id, current_stage, coalesce(array_length(completed_stages, 1), 0) as stages_done, updated_at
--    from public.projects order by current_stage desc;

-- 4. Activity over time: stage completions per day.
--    select date_trunc('day', created_at) as day, count(*) as completions
--    from public.progress_events where event = 'stage_completed'
--    group by day order by day;
