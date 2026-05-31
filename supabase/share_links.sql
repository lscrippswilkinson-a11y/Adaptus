-- Adaptus — public status-brief share links
-- Run this once in the Supabase SQL Editor (after schema.sql). Idempotent.
--
-- Adds an opaque per-project share token and a SECURITY DEFINER function that
-- returns ONE project's public-safe columns by token, to the `anon` role — so
-- a recipient can open a status brief at /?share=<token> with no login, while
-- RLS still blocks all other access. Revoking = setting share_token back to null.

-- 1. The token column (nullable; set only when the owner shares).
alter table public.projects add column if not exists share_token uuid unique;

-- 2. Public read-by-token. SECURITY DEFINER bypasses RLS but returns only the
--    single matching row's non-sensitive fields (no owner_id, no description).
create or replace function public.get_shared_project(p_token uuid)
returns jsonb
language sql
security definer
stable
set search_path = public as $$
  select to_jsonb(t) from (
    select id, name, type, target_date, current_stage, completed_stages, stage_data, created_at
    from public.projects
    where share_token = p_token
    limit 1
  ) t;
$$;

-- 3. Let anonymous (and signed-in) visitors call it.
grant execute on function public.get_shared_project(uuid) to anon, authenticated;
