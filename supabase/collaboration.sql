-- Adaptus — collaboration (invite teammates by email, owner/editor/viewer)
-- Run once in the Supabase SQL Editor (after schema.sql). Idempotent.
--
-- The members/invites tables + owner-managed policies already live in
-- schema.sql. This adds the two things the invite UX needs:
--   1. existing users (not just brand-new signups) claim invites on login, and
--   2. co-members can read each other's profile (name/avatar) for the list.

-- 1. Claim any invites addressed to the signed-in user's email. The schema's
--    signup trigger only fires for NEW users; call this on every app load so
--    already-registered invitees pick up their access too.
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

-- 2. Co-member profile reads. SECURITY DEFINER helper avoids recursive RLS.
create or replace function public.shares_project_with(p_other uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from public.project_members a
    join public.project_members b on a.project_id = b.project_id
    where a.user_id = auth.uid() and b.user_id = p_other
  );
$$;

drop policy if exists "profiles comember read" on public.profiles;
create policy "profiles comember read" on public.profiles for select to authenticated
using (id = auth.uid() or public.shares_project_with(id));
