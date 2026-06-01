-- Adaptus — per-section feedback (review comments on each stage)
-- Run once in the Supabase SQL Editor (after collaboration.sql). Idempotent.
--
-- Any member of a project can leave feedback on a section (stage), including
-- viewer-role reviewers — that's the point of sharing a project for review.
-- Authors can edit/resolve/delete their own; the owner can moderate any.

create extension if not exists pgcrypto;

create table if not exists public.project_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  stage_id text not null,
  author_id uuid not null default auth.uid() references auth.users on delete cascade,
  body text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists project_feedback_project_idx on public.project_feedback (project_id);

alter table public.project_feedback enable row level security;

-- Read: any member of the project.
drop policy if exists "feedback_select" on public.project_feedback;
create policy "feedback_select" on public.project_feedback for select to authenticated
  using (public.is_member(project_id, 'viewer'));

-- Add: any member, as themselves (viewers included — reviewers leave feedback).
drop policy if exists "feedback_insert" on public.project_feedback;
create policy "feedback_insert" on public.project_feedback for insert to authenticated
  with check (public.is_member(project_id, 'viewer') and author_id = auth.uid());

-- Edit / resolve: the author, or the project owner moderating.
drop policy if exists "feedback_update" on public.project_feedback;
create policy "feedback_update" on public.project_feedback for update to authenticated
  using (author_id = auth.uid() or public.is_member(project_id, 'owner'))
  with check (author_id = auth.uid() or public.is_member(project_id, 'owner'));

-- Delete: the author, or the project owner.
drop policy if exists "feedback_delete" on public.project_feedback;
create policy "feedback_delete" on public.project_feedback for delete to authenticated
  using (author_id = auth.uid() or public.is_member(project_id, 'owner'));
