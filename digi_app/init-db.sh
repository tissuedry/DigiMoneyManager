#!/bin/bash
set -e

echo "=== Initializing digi_db ==="

# 1. Create Supabase compatibility roles so dump.sql won't fail
psql -v ON_ERROR_STOP=0 -U postgres -d digi_db <<'EOSQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin WITH SUPERUSER CREATEDB CREATEROLE LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'dashboard_user') THEN
    CREATE ROLE dashboard_user;
  END IF;
END
$$;
EOSQL

# 2. Run dump.sql ignoring non-critical errors (like missing extensions)
if [ -f /docker-entrypoint-initdb.d/dump.sql ]; then
  echo "=== Importing dump.sql ==="
  psql -v ON_ERROR_STOP=0 -U postgres -d digi_db -f /docker-entrypoint-initdb.d/dump.sql || true
  echo "=== dump.sql import completed ==="
fi
