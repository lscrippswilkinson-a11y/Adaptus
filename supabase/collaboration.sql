-- Adaptus — collaboration (invite teammates by email, owner/editor/viewer)
-- Run once in the Supabase SQL Editor. Idempotent and self-contained: it
-- (re)creates everything the collaboration feature needs — the profiles,
-- project_members and project_invites tables, the membership helpers and
-- triggers, row-level security, invite-claiming, and co-member profile reads.
--
-- Prerequisite: the public.projects table must already exist (from schema.sql).

create extension if not exists pgcrypto;

-- ============================================================ tables

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- Invites for people who haven't signed up yet; claimed on first login.
create table if not exists public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  email text not null,
  role text not null check (role in ('editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (project_id, email)
);

-- ============================================================ functions & triggers

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

-- On signup: create a profile row and claim any invites for that email.
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

-- Claim invites for an ALREADY-registered user (the signup trigger only fires
-- once). The app calls this on every load.
create or replace function public.accept_pending_invites()
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.project_members (project_id, user_id, role)
  select i.project_id, auth.uid(), i.role
  from public.project_invites i
  join auth.users u on u.id = auth.uid()
  where lower(i.email) = lower(u.email)
  on conflict do nothing;

  delete from public.project_invites i
  using auth.users u
  where u.id = auth.uid() and lower(i.email) = lower(u.email);
end; $$;

grant execute on function public.accept_pending_invites() to authenticated;

-- Do two users share any project? SECURITY DEFINER to avoid recursive RLS.
create or replace function public.shares_project_with(p_other uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from public.project_members a
    join public.project_members b on a.project_id = b.project_id
    where a.user_id = auth.uid() and b.user_id = p_other
  );
$$;

-- ============================================================ row-level security

alter table public.profiles enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invites enable row level security;

-- profiles: manage your own row; read co-members' rows (for the members list).
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (id = auth.uid());
drop policy if exists "profiles comember read" on public.profiles;
create policy "profiles comember read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_project_with(id));

-- members & invites: visible to members, managed by the owner.
drop policy if exists "members_select" on public.project_members;
create policy "members_select" on public.project_members for select to authenticated
  using (public.is_member(project_id, 'viewer'));
drop policy if exists "members_manage" on public.project_members;
create policy "members_manage" on public.project_members for all to authenticated
  using (public.is_member(project_id, 'owner')) with check (public.is_member(project_id, 'owner'));

drop policy if exists "invites_manage" on public.project_invites;
create policy "invites_manage" on public.project_invites for all to authenticated
  using (public.is_member(project_id, 'owner')) with check (public.is_member(project_id, 'owner'));
