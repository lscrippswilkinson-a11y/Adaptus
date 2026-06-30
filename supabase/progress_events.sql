-- Privacy-preserving progress analytics (server-side, invisible to clients).
--
-- Records ONLY how far users get, never what they wrote. Each row carries a
-- generic stage id (e.g. "comms", "risk" — the same labels baked into the app)
-- and an index, plus the event type. No plan content, names, or free text ever
-- lands here, so reading this table reveals nothing sensitive about any org.
--
-- Logging happens via a DATABASE TRIGGER on the projects table (below), not the
-- client: when a project's completed_stages grows, the newly-completed stages
-- are recorded. So there is no client-side network request a user could spot in
-- dev tools, and no client code to maintain. RLS has NO policies, so the app
-- (and every signed-in user) can neither read nor write this table directly;
-- only the SECURITY DEFINER trigger writes, and you read it with the service
-- role in the SQL editor.
--
-- Run in the Supabase SQL editor (idempotent). Safe to re-run.

create table if not exists public.progress_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  -- Plain uuid (no FK) so this append-only log is fully decoupled from the
  -- projects lifecycle: deleting a project never erases its funnel history.
  project_id uuid,
  event text not null,          -- e.g. 'stage_completed'
  stage_id text,                -- generic stage key, e.g. 'comms'
  stage_idx int,                -- the stage's position in the flow (0-based)
  created_at timestamptz not null default now()
);

-- RLS on with NO policies = no direct client access at all. The trigger below
-- is SECURITY DEFINER, so it writes regardless; you read via the service role.
alter table public.progress_events enable row level security;
-- Drop the client-insert policy from the earlier client-side version, if present.
drop policy if exists "progress_insert" on public.progress_events;

-- Records the stages a project just completed. Fired server-side, so it is
-- invisible to the client and catches every completion path automatically.
create or replace function public.log_stage_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Canonical stage order (keep in sync with src/data/stages.ts). Used only to
  -- derive the 0-based stage_idx; an unknown id just yields a null index.
  ordered text[] := array[
    'define','groups','sponsor','stakeholders','risk','resistance','comms',
    'training','testing','dependencies','milestones','adoption','sustainment','executive'
  ];
  newly text[];
  s text;
begin
  -- Stages present now but not before = just completed.
  if tg_op = 'INSERT' then
    newly := new.completed_stages;
  else
    newly := array(select unnest(new.completed_stages) except select unnest(old.completed_stages));
  end if;

  foreach s in array coalesce(newly, '{}') loop
    insert into public.progress_events (user_id, project_id, event, stage_id, stage_idx)
    values (coalesce(auth.uid(), new.owner_id), new.id, 'stage_completed', s, array_position(ordered, s) - 1);
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_log_stage_progress on public.projects;
create trigger trg_log_stage_progress
  after insert or update of completed_stages on public.projects
  for each row execute function public.log_stage_progress();

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
