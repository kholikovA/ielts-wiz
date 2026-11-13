#!/bin/bash
# Nightly IELTS Wiz backup: DB dump (kept 14 days locally, 30 days on Drive) + files + edge functions.
set -euo pipefail
umask 077
C=supabase-db-1buwthblm3xjdr80kj6einmo
V=/data/coolify/services/1buwthblm3xjdr80kj6einmo/volumes
D=/root/backups
mkdir -p $D/db
TS=$(date +%Y%m%d-%H%M)
docker exec $C pg_dump -U supabase_admin -d postgres -Fc > $D/db/db-$TS.dump.tmp
mv $D/db/db-$TS.dump.tmp $D/db/db-$TS.dump
docker exec $C pg_dumpall -U supabase_admin --globals-only --no-role-passwords > $D/db/globals-$TS.sql
find $D/db -type f -mtime +14 -delete
tar -C $V -czf $D/functions.tgz functions
tar -C $V --exclude=storage/.minio.sys/tmp --exclude=storage/.minio.sys/multipart -czf $D/storage.tgz.tmp storage
mv $D/storage.tgz.tmp $D/storage-$TS.tgz
find $D -maxdepth 1 -name "storage-*.tgz" -mtime +2 -delete
R=gdrive:ielts-wiz-backups
rclone copy $D/db $R/db --max-age 3d
rclone delete $R/db --min-age 30d
rclone copy $D/functions.tgz $R/
rclone copy $D/storage-$TS.tgz $R/storage
rclone delete $R/storage --min-age 7d
echo "$(date -Is) ok" >> $D/backup.log
