#!/bin/bash
# Applies new SQL migrations and syncs edge functions from a commit on main.
# Only entry point for the GitHub Actions deploy key (forced command in
# /root/.ssh/authorized_keys). Input: SSH_ORIGINAL_COMMAND = "<40-hex sha>" or
# "<sha> all" (redeploy every function). Nothing else from the caller is used.
set -euo pipefail
exec 9>/run/iw-supabase-deploy.lock
flock 9

REPO_URL=https://github.com/kholikovA/ielts-wiz.git
REPO=/opt/iw-repo
DB=supabase-db-1buwthblm3xjdr80kj6einmo
EDGE=supabase-edge-functions-1buwthblm3xjdr80kj6einmo
FN_DIR=/data/coolify/services/1buwthblm3xjdr80kj6einmo/volumes/functions
# Server-only function dirs that are not in the repo and must never be touched.
KEEP_FNS="main hello"

read -r SHA MODE _ <<<"${SSH_ORIGINAL_COMMAND:-}"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "usage: <40-hex sha> [all]"; exit 2; }
[[ -z "${MODE:-}" || "$MODE" == all ]] || { echo "unknown mode"; exit 2; }

[ -d "$REPO/.git" ] || git clone -q "$REPO_URL" "$REPO"
cd "$REPO"
git fetch -q origin main
git merge-base --is-ancestor "$SHA" origin/main || { echo "$SHA is not on main"; exit 3; }
git checkout -q -f "$SHA"
echo "Deploying $(git log --oneline -1)"

psql() { docker exec -i "$DB" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -q "$@"; }

# ---- migrations ------------------------------------------------------------
bad=$(ls supabase/migrations | grep -vE '^[0-9]{14}_[a-z0-9_]+\.sql$' || true)
[ -z "$bad" ] || { echo "Bad migration file names: $bad"; exit 4; }
applied=$(psql -tA -c "select version from supabase_migrations.schema_migrations")
n=0
for f in $(ls supabase/migrations | sort); do
  v=${f:0:14}; name=${f:15}; name=${name%.sql}
  grep -qx "$v" <<<"$applied" && continue
  echo "Applying migration $f"
  { echo "begin;"
    cat "supabase/migrations/$f"
    echo ";"
    echo "insert into supabase_migrations.schema_migrations(version, name) values ('$v', '$name');"
    echo "commit;"; } | psql
  n=$((n+1))
done
echo "Migrations applied: $n"

# ---- edge functions ----------------------------------------------------------
changed=0
for d in supabase/functions/*/; do
  fn=$(basename "$d")
  case " $KEEP_FNS " in *" $fn "*) echo "skip reserved $fn"; continue;; esac
  out=$(rsync -rc --delete --itemize-changes "$d" "$FN_DIR/$fn/")
  if [ -n "$out" ]; then echo "Updated function $fn"; changed=1; fi
done
if [ "$changed" = 1 ] || [ "${MODE:-}" = all ]; then
  docker restart "$EDGE" >/dev/null
  for i in $(seq 1 30); do
    [ "$(docker inspect -f '{{.State.Health.Status}}' "$EDGE" 2>/dev/null)" = healthy ] && break
    sleep 2
  done
  echo "Edge runtime restarted ($(docker inspect -f '{{.State.Health.Status}}' "$EDGE"))"
else
  echo "No edge function changes."
fi
echo "Done."
