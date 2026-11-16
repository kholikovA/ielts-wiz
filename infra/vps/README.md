# VPS scripts (Contabo, 194.163.149.123)

Reference copies of scripts installed on the server. Editing these files does
not change the server — copy them over by hand after review.

| File | Installed at | Runs |
|---|---|---|
| `iw-supabase-deploy.sh` | `/usr/local/sbin/` | Forced command for the GitHub Actions deploy key (`.github/workflows/supabase-deploy.yml`) |
| `iw-backup.sh` | `/usr/local/sbin/` | Nightly 03:30 via `/etc/cron.d/iw-backup`; DB dump + storage + functions to Google Drive (`gdrive:ielts-wiz-backups`) |

Deploy key line in `/root/.ssh/authorized_keys`:

    restrict,command="/usr/local/sbin/iw-supabase-deploy.sh" ssh-ed25519 AAAA... github-actions-supabase-deploy
