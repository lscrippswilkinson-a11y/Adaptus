-- Adaptus — collaborative backend schema (Supabase / Postgres)
-- Run this once in the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- Model: a project belongs to an owner and has members with roles
-- (owner > editor > viewer). Row-Level Security enforces access in the DB
-- itself, so the browser client can talk to the tables directly and safely.

create extension if not exists pgcrypto;

-- ============================================================ tables

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  -- Defaults to the signed-in user so inserts can't arrive without an owner.
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null default '',
  type text not null default '',
  description text not null default '',
  target_date text not null default '',
  current_stage int not null default 0,
  completed_stages text[] not null default '{}',
  stage_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- Invites for people who haven't signed up yet; claimed on their first login.
create table if not exists public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  email text not null,
  role text not null check (role in ('editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (project_id, email)
);

-- ============================================================ functions & triggers

-- Keep projects.updated_at fresh.
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- Whoever creates a project becomes its owner-member automatically.
create or replace function public.add_owner_member() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end; $$;

drop trigger if exists projects_add_owner on public.projects;
create trigger projects_add_owner after insert on public.projects
  for each row execute function public.add_owner_member();

-- Membership check. SECURITY DEFINER so policies can call it without causing
-- recursive RLS evaluation on project_members.
create or replace function public.is_member(p_project uuid, p_min_role text default 'viewer')
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = p_project
      and m.user_id = auth.uid()
      and case p_min_role
        when 'owner' then m.role = 'owner'
        when 'editor' then m.role in ('owner', 'editor')
        else true
      end
  );
$$;

-- On signup: create a profile row and claim any invites addressed to that email.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;

  insert into public.project_members (project_id, user_id, role)
  select i.project_id, new.id, i.role
  from public.project_invites i
  where lower(i.email) = lower(new.email)
  on conflict do nothing;

  delete from public.project_invites where lower(email) = lower(new.email);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================ row-level security

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invites enable row level security;

-- profiles: you manage your own row. (Co-member profile reads added in the sharing phase.)
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (id = auth.uid());

-- projects: members read; owner creates/deletes; owner+editor update.
-- Policies are scoped to the `authenticated` role. NOTE: the app writes with a
-- real insert / update (never upsert) — an upsert drags the UPDATE policy into
-- every insert's RLS check, which rejects brand-new rows.
drop policy if exists "projects_select" on public.projects;
create policy "projects_select" on public.projects for select to authenticated using (public.is_member(id, 'viewer'));
drop policy if exists "projects_insert" on public.projects;
create policy "projects_insert" on public.projects for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "projects_update" on public.projects;
create policy "projects_update" on public.projects for update to authenticated using (public.is_member(id, 'editor')) with check (public.is_member(id, 'editor'));
drop policy if exists "projects_delete" on public.projects;
create policy "projects_delete" on public.projects for delete to authenticated using (public.is_member(id, 'owner'));

-- members & invites: visible to members, managed by the owner.
drop policy if exists "members_select" on public.project_members;
create policy "members_select" on public.project_members for select to authenticated using (public.is_member(project_id, 'viewer'));
drop policy if exists "members_manage" on public.project_members;
create policy "members_manage" on public.project_members for all to authenticated
  using (public.is_member(project_id, 'owner')) with check (public.is_member(project_id, 'owner'));

drop policy if exists "invites_manage" on public.project_invites;
create policy "invites_manage" on public.project_invites for all to authenticated
  using (public.is_member(project_id, 'owner')) with check (public.is_member(project_id, 'owner'));
