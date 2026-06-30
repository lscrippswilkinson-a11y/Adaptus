# Adaptus — Supabase setup (Phase 1: auth + cloud sync)

Do these once. Steps 1–5 are yours (they need the dashboard); after that, hand me
the URL + anon key and I'll wire the app to the cloud.

## 1. Create the project
1. Go to https://supabase.com → **New project** (free tier is fine).
2. Pick a name, a strong database password, and a region near you.
3. Wait ~2 min for it to provision.

## 2. Grab the API keys
- **Project Settings → API**. Copy:
  - **Project URL** (e.g. `https://abcd1234.supabase.co`)
  - **anon / public** key (safe to expose in the browser — RLS protects the data)

## 3. Create the database schema
- **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, and **Run**.
- It creates the `profiles`, `projects`, `project_members`, `project_invites` tables plus the row-level-security policies. Safe to re-run.
- Then run the remaining idempotent files **in this order** (each is its own query, safe to re-run):
  `share_links.sql` → `collaboration.sql` → `feedback.sql` → `invite_links.sql` → `progress_events.sql`.
  - `progress_events.sql` is the privacy-preserving progress tracker: it logs only *how far* users get (generic stage id + index), never plan content. There's no read policy, so you query it with the service role in the SQL editor (see the funnel queries in that file's project notes).

## 4. Turn on Google sign-in
1. In **Google Cloud Console** (https://console.cloud.google.com): create/select a project →
   **APIs & Services → Credentials → Create credentials → OAuth client ID** → type **Web application**.
2. Under **Authorized redirect URIs**, add:
   `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   (find the exact value in Supabase under Authentication → Providers → Google).
3. Copy the generated **Client ID** and **Client secret**.
4. In **Supabase → Authentication → Providers → Google**: enable it, paste the Client ID + secret, save.

## 5. Set allowed URLs
- **Supabase → Authentication → URL Configuration**:
  - **Site URL**: `http://localhost:5173`
  - **Redirect URLs**: add `http://localhost:5173` (and your production URL later).

## 6. Add the keys locally
- Copy `.env.example` to `.env.local` and fill in:
  ```
  VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
  VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
  ```
- `.env.local` is git-ignored, so the keys won't be committed.

## Then tell me
- Confirm the SQL ran and `.env.local` is set (paste the URL + anon key, or just say it's done).
- I'll build the sign-in screen, the auth gate, and switch persistence from
  localStorage to Supabase — including a one-time migration of your existing
  local projects into your new account.
