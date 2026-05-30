# Deploying Adaptus (GitHub + Vercel)

Adaptus is a static Vite SPA backed by Supabase. Going live = host the built
site on Vercel, give it the Supabase keys, and allow the new URL in Supabase +
Google.

## 1. Push the repo to GitHub
1. Create a new **empty** repo at https://github.com/new (name e.g. `adaptus`,
   private is fine; do NOT add a README/.gitignore/license).
2. Copy its URL, then from the project folder:
   ```
   git remote add origin https://github.com/<you>/adaptus.git
   git push -u origin main
   ```
   (First push opens a browser to authenticate with GitHub — that's expected.)

`.env.local` is git-ignored, so your Supabase keys are NOT pushed. Good.

## 2. Import into Vercel
1. https://vercel.com → sign in with GitHub → **Add New… → Project** → import the repo.
2. Vercel auto-detects Vite (Build `npm run build`, Output `dist`) — leave as is.
3. **Environment Variables** — add both (values from `.env.local`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy.** You'll get a URL like `https://adaptus-xxxx.vercel.app`.

Every future `git push` to `main` auto-deploys.

## 3. Tell Supabase about the live URL
- Supabase → **Authentication → URL Configuration**:
  - **Site URL**: your Vercel URL (e.g. `https://adaptus-xxxx.vercel.app`)
  - **Redirect URLs**: add the Vercel URL too (keep `http://localhost:5173` for local dev)
- (The Google OAuth client's redirect URI stays the Supabase callback —
  `https://hhxjjxzzogdqrsxsbewd.supabase.co/auth/v1/callback` — no change needed.)

## 4. Let anyone sign in (publish the Google consent screen)
- Google Cloud → **APIs & Services → OAuth consent screen** → **Publish app**.
- While in "Testing", only your listed test users can sign in. Publishing with
  basic email/profile scopes needs no lengthy verification.

## Custom domain (optional, later)
- Vercel → Project → **Settings → Domains** → add your domain.
- Then add that domain to Supabase Site URL / Redirect URLs too.
