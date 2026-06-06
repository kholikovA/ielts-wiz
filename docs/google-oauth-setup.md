# Enabling Google sign-in

The app now signs in **only** with Google (`supabase.auth.signInWithOAuth({ provider: 'google' })`).
Until the Google provider is configured in Supabase, the "Continue with Google"
button will error. One-time setup, ~10 minutes.

## 1. Google Cloud Console — create OAuth credentials

1. Go to <https://console.cloud.google.com> → create (or pick) a project.
2. **APIs & Services → OAuth consent screen**
   - User type: **External** → Create.
   - App name: `IELTS Wiz`, support email: your email, app logo optional.
   - Authorized domains: add `ielts-wiz.com` and `supabase.co`.
   - Scopes: the defaults (`email`, `profile`, `openid`) are enough → Save.
   - Publish the app (Publishing status → **Publish app**) so any Google user can
     sign in. While in "Testing" only allow-listed test users can.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**, name `IELTS Wiz Web`.
   - **Authorized redirect URIs** — add exactly (find your project ref in Supabase):
     ```
     https://jaucbfremtxmanciflab.supabase.co/auth/v1/callback
     ```
   - Create → copy the **Client ID** and **Client secret**.

## 2. Supabase — enable the Google provider

1. Dashboard → project `jaucbfremtxmanciflab` → **Authentication → Providers → Google**.
2. Toggle **Enabled**, paste the **Client ID** and **Client secret**, Save.

## 3. Supabase — allow the app's redirect URLs

**Authentication → URL Configuration**:
- **Site URL:** `https://ielts-wiz.com`
- **Redirect URLs** (add each):
  ```
  https://ielts-wiz.com/**
  http://localhost:3000/**
  ```
  (Vercel preview URLs too if you want to test OAuth on previews, e.g.
  `https://*.vercel.app/**`.)

The code sends users back to `${window.location.origin}/dashboard` (or the
`?next=` path), so these must be allow-listed or Supabase rejects the redirect.

## 4. That's it

- Profile rows are created automatically by the existing `handle_new_user`
  trigger from Google's `name` / `email`. No code change needed there.
- First sign-in shows the onboarding questionnaire (target band, prep, goals),
  gated on `profiles.onboarded` (migration `20260607_profiles_onboarded.sql`).

## Notes

- **Removing email/password:** existing email/password users can no longer sign
  in (by design). They'll be wiped in the planned fresh-start, so this is fine.
- To force the Google account chooser (so a shared device can't silently reuse
  the last account) we pass `prompt=select_account` — already in the code.
