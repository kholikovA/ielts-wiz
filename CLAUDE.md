# IELTS Wiz — working rules for Claude

## Definition of done: live on the website

The user states what should happen; Claude ships it all the way. **Do not
reply with "done", a PR link, or "it's deploying" — reply only once every
requested change is verified running on the live site.** No in-between steps
for the user (no merging, no clicking, no "refresh after a few minutes").

For every change:

1. Branch from the latest `origin/main` (never commit to `main`, never
   force-push). One focused change per PR.
2. `gh pr create --base main`, then `gh pr merge <n> --auto --merge`.
   `main` requires the `build` check (`.github/workflows/pr-check.yml`:
   tests + production build + migration file names). If it fails, fix and push
   again — keep going until it merges.
3. Wait for the deploys and verify them yourself before replying:
   - **Site** (Coolify, triggered by the GitHub webhook, ~3 min): the running
     container image tag must equal the merge commit —
     `ssh root@194.163.149.123 "docker ps --format '{{.Image}}' | grep e1gruyuuomyynxxanq4medrg"`.
     Then fetch the affected page/asset from https://www.ielts-wiz.com and
     confirm the change is actually there.
   - **Migrations / edge functions** (`.github/workflows/supabase-deploy.yml`):
     the run for the merge commit concluded `success`
     (`gh run list --workflow supabase-deploy.yml -L 1`), and new migration
     versions appear in `supabase_migrations.schema_migrations`.
4. Reply briefly: what changed and that it is live. If something could not be
   verified, say exactly what and why.

Things git can't deploy — do them on the VPS as part of the same task:
Coolify env vars/secrets (new `REACT_APP_*` also needs an `ARG` line in
`Dockerfile`), auth settings, and functions that must skip JWT verification
(router list in the edge runtime's `main/index.ts` on the server).

Ask first only for destructive or irreversible actions (deleting data, dropping
tables, removing features the user didn't ask to remove).

## Infrastructure

Everything runs on one Contabo VPS (194.163.149.123) via Coolify: the CRA
site (`Dockerfile` + `nginx.conf`) and self-hosted Supabase at
https://api.ielts-wiz.com. Vercel and the hosted Supabase project
(`jaucbfremtxmanciflab`) are retired — don't deploy to or query them.
Server scripts: `infra/vps/`.
