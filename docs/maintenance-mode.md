# Maintenance mode (full-site lock)

While the accounts / user system is being rebuilt, the whole site can be replaced
with a branded "we'll be back" screen so nobody signs up or creates data that the
planned wipe would lose.

It's a **build-time** gate (Create React App inlines `REACT_APP_*` vars at build),
so it's automatically **off** anywhere the vars aren't set — local dev and Vercel
**preview** deployments — and **on** only where you set it (Production).

## Environment variables

| Variable | Effect |
| --- | --- |
| `REACT_APP_MAINTENANCE_MODE` | `true` locks the site. Anything else (or unset) = open. |
| `REACT_APP_MAINTENANCE_BYPASS_TOKEN` | Secret token. Visiting `?unlock=<token>` unlocks the full site on that device. |

## Turn the lock ON (Production)

1. Vercel → Project → **Settings → Environment Variables**.
2. Add, scoped to **Production** only:
   - `REACT_APP_MAINTENANCE_MODE` = `true`
   - `REACT_APP_MAINTENANCE_BYPASS_TOKEN` = a long random string (e.g. `openssl rand -hex 16`)
3. **Redeploy** Production (env vars only take effect on a new build).

Leave both vars **unset** in the Preview and Development scopes so previews and
local dev stay open for building/testing.

## Bypass the lock (to keep working on the live site)

Visit once on each device/browser you want unlocked:

```
https://ielts-wiz.com/?unlock=<your-token>
```

The token is saved to `localStorage` (`iw.v1.maintBypass`) and stripped from the
URL, so the full site stays open on that device until you clear it. To re-lock a
device for testing, visit `?relock`.

## Turn the lock OFF (when the rebuild ships)

Set `REACT_APP_MAINTENANCE_MODE` to `false` (or delete it) in Production and
redeploy. The bypass token can be removed at the same time.

## Note on strength

This is a **soft** gate: the bypass token is baked into the public JS bundle, so
it keeps honest visitors out — it is not a hard security boundary. To also stop
new sign-ups at the source while locked, disable signups in
**Supabase → Authentication → Providers / Settings** (and re-enable when done).
