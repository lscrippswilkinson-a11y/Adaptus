-- Adaptus — plans (free / pro)
-- Run this once in the Supabase SQL Editor (after schema.sql and
-- share_links.sql). Idempotent, safe to re-run.
--
-- A plan is a per-USER fact, so it lives on profiles. Free gets the whole
-- method and one project; Pro buys unlimited projects and reports that carry
-- the user's own branding instead of ours.

-- 1. The column. Everyone existing lands on 'free'.
alter table public.profiles add column if not exists plan text not null default 'free';

do $$ begin
  alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'pro'));
exception when duplicate_object then null;
end $$;

-- 2. A user may READ their own plan (the existing "profiles self read" policy
--    covers it) but must not be able to WRITE it — otherwise anyone with the
--    anon key could grant themselves Pro from the browser console.
--
--    This is a trigger rather than a tightened RLS policy on purpose: a policy
--    that compares the new plan against the stored one has to sub-select from
--    profiles inside a profiles policy, which Postgres rejects as infinite
--    recursion. The trigger just puts the old value back.
--
--    Deliberately NOT security definer: `current_user` must be the caller's
--    role (`authenticated`/`anon` via PostgREST, `postgres` in the SQL editor,
--    `service_role` for a webhook), not the function owner's.
create or replace function public.protect_profile_plan()
returns trigger
language plpgsql as $$
begin
  if new.plan is distinct from old.plan
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    new.plan := old.plan;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_plan on public.profiles;
create trigger protect_profile_plan
  before update on public.profiles
  for each row execute function public.protect_profile_plan();

-- 3. The share RPC also returns the OWNER's plan. A recipient of a share link
--    has no session, so this is the only way the public brief can tell whether
--    the person who shared it is entitled to the white-labelling it requests.
--    Still no owner_id and no description: the id itself never leaves the row.
create or replace function public.get_shared_project(p_token uuid)
returns jsonb
language sql
security definer
stable
set search_path = public as $$
  select to_jsonb(t) from (
    select p.id, p.name, p.type, p.target_date, p.current_stage, p.completed_stages,
           p.stage_data, p.created_at,
           coalesce(pr.plan, 'free') as owner_plan
    from public.projects p
    left join public.profiles pr on pr.id = p.owner_id
    where p.share_token = p_token
    limit 1
  ) t;
$$;

grant execute on function public.get_shared_project(uuid) to anon, authenticated;

-- 4. Granting someone Pro by hand (run as the SQL editor, i.e. service role):
--
--    update public.profiles set plan = 'pro' where email = 'them@example.com';
--
--    Revoking is the same with 'free'. When you wire a payment provider, its
--    webhook should run exactly that statement with the service-role key.
