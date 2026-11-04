#!/bin/bash
# Applies every migration to a scratch database with stubbed auth/net schemas, then runs the smoke
# tests. Usage: PGHOST=… PGPORT=… PGUSER=… supabase/test/run.sh   (any Postgres 15+; CI uses a service container)
set -e
cd "$(dirname "$0")/../.."
export PGHOST=${PGHOST:-/tmp} PGPORT=${PGPORT:-5499} PGUSER=${PGUSER:-pgtest} PGPASSWORD=${PGPASSWORD:-}
psql -d postgres -q -c "drop database if exists revyn_test" -c "create database revyn_test"
psql -d revyn_test -q -f supabase/test/stub.sql 2>&1 | grep -v "NOTICE\|pg_cron\|control file\|must first be installed\|wal_level\|HINT" || true
fail=0
for f in supabase/migrations/*.sql; do
  sed 's/^create extension if not exists pg_net.*$/select 1;/' "$f" > /tmp/revyn-cur.sql
  if ! psql -d revyn_test -q -v ON_ERROR_STOP=1 -f /tmp/revyn-cur.sql >/tmp/revyn-out.txt 2>&1; then echo "FAILED: $f"; grep -v NOTICE /tmp/revyn-out.txt | head -20; fail=1; break; fi
done
[ $fail = 0 ] || exit 1
echo "migrations: ok ($(ls supabase/migrations/*.sql | wc -l) files)"
for t in supabase/test/[0-9]*.sql; do
  if psql -d revyn_test -q -v ON_ERROR_STOP=1 -f "$t" >/tmp/revyn-out.txt 2>&1; then echo "smoke: ok $t"; else echo "FAILED: $t"; grep -v NOTICE /tmp/revyn-out.txt | tail -20; exit 1; fi
done
echo "all green"
