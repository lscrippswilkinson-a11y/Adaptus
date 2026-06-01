-- Adaptus — shareable invite links (join by link, no email needed)
-- Run once in the Supabase SQL Editor (after collaboration.sql). Idempotent.
--
-- The owner generates a tokened link for a role; anyone who opens it while
-- signed in joins the project at that role via a SECURITY DEFINER RPC. Revoke
-- by deleting the link row.

create extension if not exists pgcrypto;

create table if not exists public.project_invite_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  role text not null check (role in ('editor', 'viewer')),
  created_at timestamptz not null default now()
);

create index if not exists project_invite_links_token_idx on public.project_invite_links (token);

-- Join the project this token belongs to, at its role. Returns the project id
-- (or null if the link was revoked). Never downgrades an existing membership.
create or replace function public.accept_invite_link(p_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_project uuid;
  v_role text;
begin
  select project_id, role into v_project, v_role
  from public.project_invite_links where token = p_token;
  if v_project is null then return null; end if;

  insert into public.project_members (project_id, user_id, role)
  values (v_project, auth.uid(), v_role)
  on conflict (project_id, user_id) do nothing;

  return v_project;
end; $$;

grant execute on function public.accept_invite_link(uuid) to authenticated;

alter table public.project_invite_links enable row level security;

-- Only the owner can create / see / revoke a project's links. Recipients don't
-- read this table — they go through the SECURITY DEFINER RPC above.
drop policy if exists "invite_links_manage" on public.project_invite_links;
create policy "invite_links_manage" on public.project_invite_links for all to authenticated
  using (public.is_member(project_id, 'owner')) with check (public.is_member(project_id, 'owner'));
