#!/usr/bin/env bash
# Runs the migrations and access-rule tests on a throwaway local Postgres.
# Needs Postgres 15+ binaries (initdb, pg_ctl, psql) on PATH or in /usr/lib/postgresql/*/bin.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/.." && pwd)"
bin="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
export PATH="${bin:+$bin:}$PATH"

tmp="$(mktemp -d)"
port="${PGTEST_PORT:-54329}"
run() { if [ "$(id -u)" = 0 ]; then runuser -u postgres -- "$@"; else "$@"; fi; }
[ "$(id -u)" = 0 ] && chown postgres "$tmp"

cleanup() { run pg_ctl -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$tmp"; }
trap cleanup EXIT

run initdb -D "$tmp/data" -U postgres --auth=trust >/dev/null
run pg_ctl -D "$tmp/data" -o "-p $port -k $tmp -c listen_addresses=''" -l "$tmp/log" start >/dev/null

psql_() { run psql -h "$tmp" -p "$port" -U postgres -d postgres -q -v ON_ERROR_STOP=1 "$@"; }

psql_ < "$here/supabase-shim.sql"
for f in "$root"/migrations/*.sql; do
  echo "migrate: $(basename "$f")"
  psql_ < "$f"
done
for t in "$here"/*.test.sql; do
  echo "test: $(basename "$t")"
  psql_ < "$t"
done
