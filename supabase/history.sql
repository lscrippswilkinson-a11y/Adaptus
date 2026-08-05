-- Adaptus — project history (the Premium trend charts)
--
-- One row per project per DAY: a reading of where the change stood. That's what
-- turns "readiness is 72%" into "readiness is 72%, up from 54% three weeks ago",
-- which is the sentence a rollout lead actually needs in front of a sponsor.
--
-- Deliberately a daily grain, not an event log: the value is the shape of the
-- curve over weeks, and a row per keystroke would cost a hundred times as much
-- to store and read for a chart that looks identical.
--
-- The numbers are DERIVED (progress, readiness, change load, risk, head counts),
-- never the plan's content — no names, no free text. Same privacy posture as
-- progress_events.sql.
--
-- Run in the Supabase SQL editor (idempotent). Safe to re-run.
-- Requires: schema.sql (projects, public.is_member).

create table if not exists public.project_snapshots (
  project_id uuid not null references public.projects on delete cascade,
  -- The reading's date. One row per project per day; the day's last write wins,
  -- so the snapshot always reflects where the project was left that day.
  day date not null default current_date,
  progress int,       -- 0-100, essential steps completed
  readiness int,      -- 0-100, mean readiness of the impacted groups
  change_load int,    -- 0-100, change load on the busiest impacted team
  risk int,           -- 0-100, mean scored risk (null when nothing is scored yet)
  teams int,          -- distinct impacted groups
  people int,         -- people affected, summed across those groups
  created_at timestamptz not null default now(),
  primary key (project_id, day)
);

create index if not exists project_snapshots_day_idx on public.project_snapshots (day);

alter table public.project_snapshots enable row level security;

-- Members read their projects' history. There is deliberately NO insert/update
-- policy: every write goes through record_snapshot() below, which is SECURITY
-- DEFINER and does its own membership check. That keeps the daily row from
-- being forgeable by a client that decides to POST whatever it likes.
drop policy if exists "snapshots_select" on public.project_snapshots;
create policy "snapshots_select" on public.project_snapshots for select to authenticated
  using (public.is_member(project_id, 'viewer'));

-- Record (or refresh) today's reading. Called by the app after it syncs a
-- project, so the row tracks the state the user actually left behind.
--
-- NOTE the ON CONFLICT: this is an upsert, but a server-side one. Doing it from
-- the client via supabase-js `.upsert()` would emit INSERT ... ON CONFLICT DO
-- UPDATE through PostgREST, which drags the table's UPDATE policy into every
-- insert's RLS check — the same 42501 that bit the projects table. Here the
-- function owns the write, so there is no policy to trip over.
create or replace function public.record_snapshot(
  p_project uuid,
  p_progress int,
  p_readiness int,
  p_change_load int,
  p_risk int,
  p_teams int,
  p_people int
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Editors and owners only: a viewer looking at a shared project must not be
  -- able to move someone else's history.
  if not public.is_member(p_project, 'editor') then
    return;
  end if;

  insert into public.project_snapshots as s
    (project_id, day, progress, readiness, change_load, risk, teams, people)
  values
    (p_project, current_date, p_progress, p_readiness, p_change_load, p_risk, p_teams, p_people)
  on conflict (project_id, day) do update set
    progress = excluded.progress,
    readiness = excluded.readiness,
    change_load = excluded.change_load,
    risk = excluded.risk,
    teams = excluded.teams,
    people = excluded.people;
end;
$$;

grant execute on function public.record_snapshot(uuid, int, int, int, int, int, int) to authenticated;
