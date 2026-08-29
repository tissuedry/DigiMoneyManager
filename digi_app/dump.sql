--
-- PostgreSQL database dump
--

\restrict fWl5hjqzMJGNrZ8ypvypvhkrlyvPOX1UMnfhbAFFpcbgfoSjJu2xbwiW3tpt0LA

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_realtime_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_realtime_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_realtime_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_realtime_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_realtime_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
    revoke trigger on cron.job_run_details from postgres;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
begin
    if not exists (
        select 1
        from pg_catalog.pg_event_trigger_ddl_commands() ev
        join pg_catalog.pg_extension e on ev.objid = e.oid
        where e.extname = 'pg_graphql'
    ) then
        return;
    end if;

    drop function if exists graphql_public.graphql;
    create or replace function graphql_public.graphql(
        "operationName" text default null,
        query text default null,
        variables jsonb default null,
        extensions jsonb default null
    )
        returns jsonb
        language sql
        set search_path to ''
    as $$
        select graphql.resolve(
            query := query,
            variables := coalesce(variables, '{}'),
            "operationName" := "operationName",
            extensions := extensions
        );
    $$;

    -- Attach the wrapper to the extension so DROP EXTENSION cascades to it,
    -- which in turn triggers set_graphql_placeholder to reinstall the "not enabled" stub.
    alter extension pg_graphql add function graphql_public.graphql(text, text, jsonb, jsonb);

    grant usage on schema graphql to postgres, anon, authenticated, service_role;
    grant execute on function graphql.resolve to postgres, anon, authenticated, service_role;
    grant usage on schema graphql to postgres with grant option;
    grant usage on schema graphql_public to postgres with grant option;
end;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8.0', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
            set search_path to ''
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: supabase_admin
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


ALTER FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) OWNER TO supabase_admin;

--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    -- Reset the role on every FOR..LOOP batch execution.
                    -- The first batch of 10 rows is pre-fetched using the current connection role (PG internal behaviour)
                    -- then we have to reset it again otherwise it would use the role defined in the `set_config` above
                    -- to fetch the remaining rows when rows>10, which could be a user-defined role that lacks execution grants.
                    -- The flow is:
                    --   1. run batch with conn role
                    --   2. set_config working_role
                    --   3. execute walrus
                    --   4. reset role (revert)
                    --   5. repeat
                    perform set_config('role', null, true);

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_realtime_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_realtime_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_realtime_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_realtime_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_realtime_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) OWNER TO supabase_realtime_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_realtime_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_realtime_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_realtime_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_realtime_admin;

--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) OWNER TO supabase_realtime_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_realtime_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_realtime_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


ALTER FUNCTION realtime.wal2json_escape_identifier(name text) OWNER TO supabase_realtime_admin;

--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION storage.allow_any_operation(expected_operations text[]) OWNER TO supabase_storage_admin;

--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION storage.allow_only_operation(expected_operation text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[array_length(_parts, 1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_prefix_len INT;
    v_prefix_start INT;
    v_combined_levels INT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_prefix_len := length(coalesce(prefix, ''));
    v_prefix_start := coalesce(array_length(string_to_array(coalesce(prefix, ''), v_delimiter), 1), 1);
    v_combined_levels := coalesce(array_length(string_to_array(v_prefix, v_delimiter), 1), 1);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT array_to_string(path_tokens[$1:$2], '/') AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $3 || '%%'
                  AND bucket_id = $4
                  AND array_length(objects.path_tokens, 1) <> $2
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT array_to_string(path_tokens[$1:$2], '/') AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $3 || '%%'
               AND bucket_id = $4
               AND array_length(objects.path_tokens, 1) = $2
             ORDER BY %I %s)
            LIMIT $5 OFFSET $6
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING v_prefix_start, v_combined_levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := substring(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter) from v_prefix_len + 1);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := substring(v_current.name from v_prefix_len + 1);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
    v_sort_order text;
    v_sort_column text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    -- Defense-in-depth: this function is independently reachable and must
    -- not trust p_sort_order/p_sort_column to already be validated by a
    -- caller. Normalize to the same strict allow-list storage.search_v2
    -- uses before interpolating anything into dynamic SQL below.
    v_sort_order := lower(coalesce(p_sort_order, 'asc'));
    IF v_sort_order NOT IN ('asc', 'desc') THEN
        v_sort_order := 'asc';
    END IF;

    v_sort_column := lower(coalesce(p_sort_column, 'updated_at'));
    IF v_sort_column NOT IN ('updated_at', 'created_at') THEN
        v_sort_column := 'updated_at';
    END IF;

    IF v_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        v_sort_column,
        v_cursor_op,
        v_sort_column,
        v_sort_order,
        v_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


ALTER TABLE auth.webauthn_challenges OWNER TO supabase_auth_admin;

--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE auth.webauthn_credentials OWNER TO supabase_auth_admin;

--
-- Name: approval; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approval (
    id integer NOT NULL,
    reimbursement_id integer NOT NULL,
    approver_id integer NOT NULL,
    level text NOT NULL,
    status text NOT NULL,
    catatan text,
    alasan text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.approval OWNER TO postgres;

--
-- Name: approval_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.approval_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approval_id_seq OWNER TO postgres;

--
-- Name: approval_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.approval_id_seq OWNED BY public.approval.id;


--
-- Name: audit_trail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_trail (
    id integer NOT NULL,
    user_id integer NOT NULL,
    aksi text NOT NULL,
    detail text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_trail OWNER TO postgres;

--
-- Name: audit_trail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_trail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_trail_id_seq OWNER TO postgres;

--
-- Name: audit_trail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_trail_id_seq OWNED BY public.audit_trail.id;


--
-- Name: budget; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget (
    id integer NOT NULL,
    proyek_id integer NOT NULL,
    total_pengeluaran numeric(15,2) DEFAULT 0 NOT NULL,
    total_reimbursement numeric(15,2) DEFAULT 0 NOT NULL,
    sisa_budget numeric(15,2) NOT NULL,
    pemasukan_belum_dialokasikan numeric(15,2) DEFAULT 0 NOT NULL,
    total_pemasukan numeric(15,2) DEFAULT 0 NOT NULL,
    nilai_kontrak numeric(15,2) DEFAULT 0 NOT NULL,
    target_pemasukan numeric(15,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.budget OWNER TO postgres;

--
-- Name: budget_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budget_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budget_id_seq OWNER TO postgres;

--
-- Name: budget_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budget_id_seq OWNED BY public.budget.id;


--
-- Name: jurnal_akuntansi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jurnal_akuntansi (
    id integer NOT NULL,
    reimbursement_id integer,
    no_akun_kredit text NOT NULL,
    no_akun_debit text NOT NULL,
    nominal numeric(15,2) NOT NULL,
    keterangan text,
    transaksi_pemasukan_id integer
);


ALTER TABLE public.jurnal_akuntansi OWNER TO postgres;

--
-- Name: jurnal_akuntansi_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jurnal_akuntansi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jurnal_akuntansi_id_seq OWNER TO postgres;

--
-- Name: jurnal_akuntansi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jurnal_akuntansi_id_seq OWNED BY public.jurnal_akuntansi.id;


--
-- Name: keterangan_anggaran; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.keterangan_anggaran (
    id integer NOT NULL,
    sub_anggaran_id integer NOT NULL,
    keterangan text NOT NULL,
    nominal_alokasi numeric(15,2) NOT NULL,
    nominal_realisasi numeric(15,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.keterangan_anggaran OWNER TO postgres;

--
-- Name: keterangan_anggaran_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.keterangan_anggaran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.keterangan_anggaran_id_seq OWNER TO postgres;

--
-- Name: keterangan_anggaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.keterangan_anggaran_id_seq OWNED BY public.keterangan_anggaran.id;


--
-- Name: main_anggaran; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_anggaran (
    id integer NOT NULL,
    budget_id integer NOT NULL,
    nama_main text NOT NULL,
    nominal_alokasi numeric(15,2) NOT NULL,
    nominal_terpakai numeric(15,2) DEFAULT 0 NOT NULL,
    tipe text DEFAULT 'pengeluaran'::text NOT NULL
);


ALTER TABLE public.main_anggaran OWNER TO postgres;

--
-- Name: main_anggaran_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.main_anggaran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.main_anggaran_id_seq OWNER TO postgres;

--
-- Name: main_anggaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.main_anggaran_id_seq OWNED BY public.main_anggaran.id;


--
-- Name: master_main; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_main (
    id integer NOT NULL,
    nama text NOT NULL,
    tipe text DEFAULT 'pengeluaran'::text NOT NULL
);


ALTER TABLE public.master_main OWNER TO postgres;

--
-- Name: master_main_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_main_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_main_id_seq OWNER TO postgres;

--
-- Name: master_main_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_main_id_seq OWNED BY public.master_main.id;


--
-- Name: master_sub; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_sub (
    id integer NOT NULL,
    main_id integer NOT NULL,
    nama text NOT NULL,
    tipe text DEFAULT 'pengeluaran'::text NOT NULL
);


ALTER TABLE public.master_sub OWNER TO postgres;

--
-- Name: master_sub_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_sub_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_sub_id_seq OWNER TO postgres;

--
-- Name: master_sub_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_sub_id_seq OWNED BY public.master_sub.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tipe text NOT NULL,
    pesan text NOT NULL,
    dibaca boolean DEFAULT false NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: pengajuan_anggaran; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengajuan_anggaran (
    id integer NOT NULL,
    proyek_id integer NOT NULL,
    pengaju_id integer NOT NULL,
    main_anggaran_id integer NOT NULL,
    judul text NOT NULL,
    deskripsi text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    catatan text,
    alokasi_lama numeric(15,2) NOT NULL,
    alokasi_baru numeric(15,2) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diproses_pada timestamp(3) without time zone
);


ALTER TABLE public.pengajuan_anggaran OWNER TO postgres;

--
-- Name: pengajuan_anggaran_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengajuan_anggaran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengajuan_anggaran_id_seq OWNER TO postgres;

--
-- Name: pengajuan_anggaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengajuan_anggaran_id_seq OWNED BY public.pengajuan_anggaran.id;


--
-- Name: proyek; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proyek (
    id integer NOT NULL,
    nama text NOT NULL,
    deskripsi text,
    status text NOT NULL,
    tanggal_mulai timestamp(3) without time zone NOT NULL,
    tanggal_selesai timestamp(3) without time zone
);


ALTER TABLE public.proyek OWNER TO postgres;

--
-- Name: proyek_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proyek_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proyek_id_seq OWNER TO postgres;

--
-- Name: proyek_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proyek_id_seq OWNED BY public.proyek.id;


--
-- Name: reimbursement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reimbursement (
    id integer NOT NULL,
    user_id integer NOT NULL,
    proyek_id integer NOT NULL,
    keterangan_anggaran_id integer NOT NULL,
    nama text,
    tipe text,
    merchant text,
    tanggal_struk timestamp(3) without time zone,
    kategori_bukti text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    nominal numeric(15,2) NOT NULL,
    url_struk text NOT NULL,
    fraud_flag boolean DEFAULT false NOT NULL,
    status text NOT NULL
);


ALTER TABLE public.reimbursement OWNER TO postgres;

--
-- Name: reimbursement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reimbursement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reimbursement_id_seq OWNER TO postgres;

--
-- Name: reimbursement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reimbursement_id_seq OWNED BY public.reimbursement.id;


--
-- Name: sub_anggaran; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sub_anggaran (
    id integer NOT NULL,
    main_anggaran_id integer NOT NULL,
    nama_sub text NOT NULL,
    nominal_alokasi numeric(15,2) NOT NULL,
    nominal_terpakai numeric(15,2) DEFAULT 0 NOT NULL,
    tipe text DEFAULT 'pengeluaran'::text NOT NULL
);


ALTER TABLE public.sub_anggaran OWNER TO postgres;

--
-- Name: sub_anggaran_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sub_anggaran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sub_anggaran_id_seq OWNER TO postgres;

--
-- Name: sub_anggaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sub_anggaran_id_seq OWNED BY public.sub_anggaran.id;


--
-- Name: termin_pembayaran; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.termin_pembayaran (
    id integer NOT NULL,
    proyek_id integer NOT NULL,
    nama_termin text NOT NULL,
    urutan integer DEFAULT 1 NOT NULL,
    persentase_progress numeric(5,2) NOT NULL,
    nominal numeric(15,2) NOT NULL,
    status text DEFAULT 'BELUM_DITERIMA'::text NOT NULL,
    tanggal_pencairan timestamp(3) without time zone,
    catatan text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.termin_pembayaran OWNER TO postgres;

--
-- Name: termin_pembayaran_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.termin_pembayaran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.termin_pembayaran_id_seq OWNER TO postgres;

--
-- Name: termin_pembayaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.termin_pembayaran_id_seq OWNED BY public.termin_pembayaran.id;


--
-- Name: transaksi_pemasukan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaksi_pemasukan (
    id integer NOT NULL,
    proyek_id integer NOT NULL,
    user_id integer,
    sub_coa_id integer,
    kategori text NOT NULL,
    nominal numeric(15,2) NOT NULL,
    tanggal_transaksi timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    keterangan text,
    bukti_url text,
    status text DEFAULT 'TERCATAT'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.transaksi_pemasukan OWNER TO postgres;

--
-- Name: transaksi_pemasukan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transaksi_pemasukan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transaksi_pemasukan_id_seq OWNER TO postgres;

--
-- Name: transaksi_pemasukan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transaksi_pemasukan_id_seq OWNED BY public.transaksi_pemasukan.id;


--
-- Name: user_proyek; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_proyek (
    id integer NOT NULL,
    proyek_id integer NOT NULL,
    user_id integer NOT NULL,
    role text NOT NULL,
    divisi text,
    joined_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_proyek OWNER TO postgres;

--
-- Name: user_proyek_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_proyek_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_proyek_id_seq OWNER TO postgres;

--
-- Name: user_proyek_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_proyek_id_seq OWNED BY public.user_proyek.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    nama text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone DEFAULT now()
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_realtime_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL,
    versioning_status text DEFAULT 'DISABLED'::text NOT NULL,
    CONSTRAINT buckets_versioning_dark_check CHECK ((versioning_status = 'DISABLED'::text)),
    CONSTRAINT buckets_versioning_standard_only_check CHECK (((type = 'STANDARD'::storage.buckettype) OR (versioning_status = 'DISABLED'::text))),
    CONSTRAINT buckets_versioning_status_check CHECK ((versioning_status = ANY (ARRAY['DISABLED'::text, 'ENABLED'::text, 'SUSPENDED'::text])))
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    archived_at timestamp with time zone,
    is_delete_marker boolean DEFAULT false NOT NULL,
    is_versioned boolean DEFAULT false NOT NULL
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: approval id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval ALTER COLUMN id SET DEFAULT nextval('public.approval_id_seq'::regclass);


--
-- Name: audit_trail id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_trail ALTER COLUMN id SET DEFAULT nextval('public.audit_trail_id_seq'::regclass);


--
-- Name: budget id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget ALTER COLUMN id SET DEFAULT nextval('public.budget_id_seq'::regclass);


--
-- Name: jurnal_akuntansi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jurnal_akuntansi ALTER COLUMN id SET DEFAULT nextval('public.jurnal_akuntansi_id_seq'::regclass);


--
-- Name: keterangan_anggaran id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keterangan_anggaran ALTER COLUMN id SET DEFAULT nextval('public.keterangan_anggaran_id_seq'::regclass);


--
-- Name: main_anggaran id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_anggaran ALTER COLUMN id SET DEFAULT nextval('public.main_anggaran_id_seq'::regclass);


--
-- Name: master_main id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_main ALTER COLUMN id SET DEFAULT nextval('public.master_main_id_seq'::regclass);


--
-- Name: master_sub id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_sub ALTER COLUMN id SET DEFAULT nextval('public.master_sub_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: pengajuan_anggaran id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_anggaran ALTER COLUMN id SET DEFAULT nextval('public.pengajuan_anggaran_id_seq'::regclass);


--
-- Name: proyek id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyek ALTER COLUMN id SET DEFAULT nextval('public.proyek_id_seq'::regclass);


--
-- Name: reimbursement id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reimbursement ALTER COLUMN id SET DEFAULT nextval('public.reimbursement_id_seq'::regclass);


--
-- Name: sub_anggaran id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_anggaran ALTER COLUMN id SET DEFAULT nextval('public.sub_anggaran_id_seq'::regclass);


--
-- Name: termin_pembayaran id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.termin_pembayaran ALTER COLUMN id SET DEFAULT nextval('public.termin_pembayaran_id_seq'::regclass);


--
-- Name: transaksi_pemasukan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaksi_pemasukan ALTER COLUMN id SET DEFAULT nextval('public.transaksi_pemasukan_id_seq'::regclass);


--
-- Name: user_proyek id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_proyek ALTER COLUMN id SET DEFAULT nextval('public.user_proyek_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at, custom_claims_allowlist) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
20260625000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: approval; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.approval (id, reimbursement_id, approver_id, level, status, catatan, alasan, "timestamp") FROM stdin;
47	35	4	PM	APPROVED_BY_PM	Auto-approved (Pengajuan langsung oleh level Manajerial/Admin)	\N	2026-08-20 13:28:52.048
48	36	4	PM	APPROVED_BY_PM	Auto-approved (Pengajuan langsung oleh level Manajerial/Admin)	\N	2026-08-20 13:29:05.7
49	37	4	PM	APPROVED_BY_PM	Auto-approved (Pengajuan langsung oleh level Manajerial/Admin)	\N	2026-08-20 13:29:21.094
50	38	4	PM	APPROVED_BY_PM	Auto-approved (Pengajuan langsung oleh level Manajerial/Admin)	\N	2026-08-20 13:29:44.639
51	40	4	PM	APPROVED_BY_PM	\N	\N	2026-08-20 13:31:18.553
52	39	4	PM	APPROVED_BY_PM	\N	\N	2026-08-20 13:31:23.204
53	40	3	KEUANGAN	APPROVED	\N	\N	2026-08-20 13:32:04.924
54	39	3	KEUANGAN	APPROVED	\N	\N	2026-08-20 13:32:11.804
55	38	3	KEUANGAN	APPROVED	\N	\N	2026-08-20 13:32:17.499
56	37	3	KEUANGAN	APPROVED	\N	\N	2026-08-20 13:32:23.466
57	36	3	KEUANGAN	APPROVED	\N	\N	2026-08-20 13:32:29.023
58	35	3	KEUANGAN	APPROVED	\N	\N	2026-08-20 13:32:34.392
59	47	1	PM	APPROVED_BY_PM	Auto-approved (Pengajuan langsung oleh level Manajerial/Admin)	\N	2026-08-24 06:44:39.732
60	48	1	PM	APPROVED_BY_PM	Auto-approved (Pengajuan langsung oleh level Manajerial/Admin)	\N	2026-08-24 09:03:38.599
61	48	1	SUPER_ADMIN	REJECTED	\N	Diamlah Bodo	2026-08-24 09:13:35.91
62	47	1	SUPER_ADMIN	APPROVED	\N	\N	2026-08-24 09:13:56.584
63	49	1	PM	APPROVED_BY_PM	Auto-approved (Pengajuan langsung oleh level Manajerial/Admin)	\N	2026-08-24 09:14:36.947
69	49	3	KEUANGAN	REJECTED	\N	nuh uh	2026-08-25 04:14:42.015
70	43	1	SUPER_ADMIN	APPROVED_BY_PM	\N	\N	2026-08-25 06:36:20.987
71	45	1	SUPER_ADMIN	APPROVED_BY_PM	\N	\N	2026-08-25 06:37:24.948
80	43	3	KEUANGAN	APPROVED	\N	\N	2026-08-26 04:35:20.181
82	46	4	PM	APPROVED_BY_PM	\N	\N	2026-08-26 14:19:41.023
83	46	3	KEUANGAN	APPROVED	\N	\N	2026-08-26 14:27:29.423
84	45	3	KEUANGAN	APPROVED	\N	\N	2026-08-26 14:29:57.981
85	44	1	SUPER_ADMIN	APPROVED_BY_PM	\N	\N	2026-08-26 14:40:27.783
86	44	3	KEUANGAN	APPROVED	\N	\N	2026-08-26 14:41:06.328
89	42	4	PM	APPROVED_BY_PM	\N	\N	2026-08-26 16:15:23.514
90	42	1	SUPER_ADMIN	APPROVED	\N	\N	2026-08-26 16:23:04.129
91	41	1	SUPER_ADMIN	APPROVED_BY_PM	\N	\N	2026-08-26 16:23:15.364
96	66	4	PM	APPROVED_BY_PM	\N	\N	2026-08-27 05:44:20.252
97	66	3	KEUANGAN	APPROVED	\N	\N	2026-08-27 05:45:25.334
98	67	4	PM	REJECTED	\N	Tidak Sesuai	2026-08-27 11:17:42.749
99	72	4	PM	APPROVED_BY_PM	Auto-approved (Pengajuan langsung oleh level Manajerial/Admin)	\N	2026-08-27 14:59:36.053
100	71	4	PM	APPROVED_BY_PM	\N	\N	2026-08-27 15:17:17.958
101	70	4	PM	REJECTED	\N	Ulang	2026-08-27 15:20:38.588
106	78	4	PM	APPROVED_BY_PM	\N	\N	2026-08-28 06:33:34.729
107	77	4	PM	REJECTED	\N	Bohong euy	2026-08-28 06:33:57.894
108	78	3	KEUANGAN	APPROVED	\N	\N	2026-08-28 06:34:51.251
109	79	4	PM	APPROVED_BY_PM	Auto-approved (Pengajuan langsung oleh level Manajerial/Admin)	\N	2026-08-28 06:37:17.672
110	79	3	KEUANGAN	APPROVED	\N	\N	2026-08-28 06:37:52.011
111	69	4	PM	APPROVED_BY_PM	\N	\N	2026-08-28 07:40:24.05
\.


--
-- Data for Name: audit_trail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_trail (id, user_id, aksi, detail, "timestamp") FROM stdin;
1	1	register	User Damar Muharram terdaftar dengan role Superadmin.	2026-08-10 11:28:04.246
2	2	register	User Alif Ihsan terdaftar dengan role Direktur / Manajemen.	2026-08-10 11:29:21.47
3	3	register	User Ghanif Hadiyana Akbar terdaftar dengan role Tim Keuangan.	2026-08-10 11:30:07.287
4	4	register	User Muhammad Zaini terdaftar dengan role Project Manager.	2026-08-10 11:30:23.049
5	5	register	User Bimantara terdaftar dengan role Karyawan.	2026-08-10 11:30:41.244
6	2	login	User Alif Ihsan berhasil login.	2026-08-10 11:31:08.482
7	2	login	User Alif Ihsan berhasil login.	2026-08-10 11:31:21.409
8	5	login	User Bimantara berhasil login.	2026-08-10 11:31:25.571
9	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-10 11:31:33.919
10	1	login	User Damar Muharram berhasil login.	2026-08-10 11:31:48.977
11	1	update_member	Super Admin memperbarui data anggota: Muhammad Alvin Ababil (Karyawan)	2026-08-10 11:32:24.371
12	2	login	User Alif Ihsan berhasil login.	2026-08-10 11:32:52.421
13	2	create_proyek	Direktur / Manajemen membuat proyek baru: Zaini	2026-08-10 11:33:19.086
14	2	assign_project_members	Direktur mengatur ulang anggota proyek Zaini (2 orang)	2026-08-10 11:34:12.847
15	1	login	User Damar Muharram berhasil login.	2026-08-10 11:34:47.135
16	1	create_master_data	Super Admin - Menambahkan Master Main baru: Biaya Marketing Proyek	2026-08-10 11:35:34.56
17	1	create_master_data	Super Admin - Menambahkan Master Main baru: Biaya Administrasi Proyek	2026-08-10 11:35:57.09
18	1	create_master_data	Super Admin - Menambahkan Master Main baru: Biaya Produksi Proyek	2026-08-10 11:36:11.382
19	1	create_master_data	Super Admin - Menambahkan Master Sub baru: Biaya Marketing Proyek	2026-08-10 11:36:16.251
20	1	create_master_data	Super Admin - Menambahkan Master Sub baru: Biaya Marketing Proyek Lainnya	2026-08-10 11:36:23.652
21	1	create_master_data	Super Admin - Menambahkan Master Sub baru: Biaya Jaminan Proyek	2026-08-10 11:36:29.681
22	1	create_master_data	Super Admin - Menambahkan Master Sub baru: Pembuatan Dokumen Kontrak	2026-08-10 11:36:34.281
23	1	create_master_data	Super Admin - Menambahkan Master Sub baru: Biaya Administrasi Proyek Lainnya	2026-08-10 11:36:38.082
24	1	create_master_data	Super Admin - Menambahkan Master Sub baru: Biaya Personil	2026-08-10 11:36:45.25
25	1	create_master_data	Super Admin - Menambahkan Master Sub baru: Biaya Non Personil	2026-08-10 11:36:49.093
26	1	create_master_data	Super Admin - Menambahkan Master Sub baru: Biaya Pengadaan Barang dan Jasa	2026-08-10 11:36:52.44
27	1	create_master_data	Super Admin - Menambahkan Master Sub baru: Biaya Garansi	2026-08-10 11:36:56.187
28	1	login	User Damar Muharram berhasil login.	2026-08-10 11:37:32.169
29	2	login	User Alif Ihsan berhasil login.	2026-08-10 11:37:36.852
30	2	input_rab	Direktur menginput RAB proyek Zaini senilai Rp 10,000,000	2026-08-10 11:38:02.93
31	2	update_project	Direktur memperbarui proyek: Zaini (Status: AKTIF)	2026-08-10 11:38:07.738
32	4	login	User Muhammad Zaini berhasil login.	2026-08-10 11:38:28.542
33	4	alokasi_pos	Project Manager mengalokasikan 2 pos baru pada proyek Zaini	2026-08-10 11:39:35.89
34	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-10 11:40:56.979
35	4	login	User Muhammad Zaini berhasil login.	2026-08-10 11:41:08.319
36	2	login	User Alif Ihsan berhasil login.	2026-08-10 11:42:46.817
37	2	review_pengajuan_anggaran	Direktur menyetujui pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" (Biaya Produksi Proyek) untuk proyek Zaini.	2026-08-10 11:43:15.78
38	4	login	User Muhammad Zaini berhasil login.	2026-08-10 11:43:24.403
39	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-10 11:43:50.34
40	4	login	User Muhammad Zaini berhasil login.	2026-08-10 11:44:57.07
41	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-10 11:48:17.686
42	1	login	User Damar Muharram berhasil login.	2026-08-10 11:48:25.407
43	1	create_master_data	Super Admin - Menambahkan Master Keterangan baru: Biaya Perjalanan Dinas	2026-08-10 11:48:42.864
44	4	login	User Muhammad Zaini berhasil login.	2026-08-10 11:48:50.712
45	1	login	User Damar Muharram berhasil login.	2026-08-10 11:50:37.773
46	1	delete_master_data	Super Admin - Menghapus Master Keterangan (ID: 1)	2026-08-10 11:50:47.94
47	4	login	User Muhammad Zaini berhasil login.	2026-08-10 11:50:55.675
48	4	alokasi_pos	Project Manager mengalokasikan 3 pos baru pada proyek Zaini	2026-08-10 12:18:26.397
49	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-10 12:19:53.289
50	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 140,000 untuk proyek Zaini	2026-08-10 12:23:08.053
51	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 38,000 untuk proyek Zaini	2026-08-10 12:24:24.083
52	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 3,157,950 untuk proyek Zaini	2026-08-10 12:26:06.272
53	4	login	User Muhammad Zaini berhasil login.	2026-08-10 12:27:07.93
54	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 38,000 oleh Muhammad Alvin Ababil	2026-08-10 12:29:24.247
55	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 140,000 oleh Muhammad Alvin Ababil	2026-08-10 12:29:31.486
56	4	reject_pengajuan	PM menolak pengajuan Reimbursement Rp 3,157,950 oleh Muhammad Alvin Ababil	2026-08-10 12:29:55.365
57	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-10 12:30:03.646
58	1	login	User Damar Muharram berhasil login.	2026-08-10 12:30:43.278
59	1	create_coa	Membuat Chart of Accounts baru: 1 - BCA	2026-08-10 12:31:34.506
60	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-10 12:31:58.976
61	1	login	User Damar Muharram berhasil login.	2026-08-10 12:37:51.86
62	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-10 12:40:59.209
63	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 38,000 oleh Muhammad Alvin Ababil. Jurnal Debit: 1, Kredit: 1	2026-08-10 12:41:07.099
64	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 140,000 oleh Muhammad Alvin Ababil. Jurnal Debit: 1, Kredit: 1	2026-08-10 12:41:27.579
65	4	login	User Muhammad Zaini berhasil login.	2026-08-10 12:41:34.431
66	1	login	User Damar Muharram berhasil login.	2026-08-10 12:42:53.228
67	1	create_coa	Membuat Chart of Accounts baru: 2 - Mandiri	2026-08-10 12:43:00.62
68	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-10 12:43:09.17
69	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 43,500 untuk proyek Zaini	2026-08-10 12:43:41.137
70	4	login	User Muhammad Zaini berhasil login.	2026-08-10 12:43:46.761
71	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 43,500 oleh Muhammad Alvin Ababil	2026-08-10 12:43:56.765
72	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-10 12:44:01.9
73	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 43,500 oleh Muhammad Alvin Ababil. Jurnal Debit: 1, Kredit: 2	2026-08-10 12:44:12.859
1219	4	login	User Muhammad Zaini berhasil login.	2026-08-27 16:52:46.072
1222	4	login	User Muhammad Zaini berhasil login.	2026-08-27 16:56:47.423
1223	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 16:57:00.838
1248	1	login	User Damar Muharram berhasil login.	2026-08-27 17:32:47.891
1263	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 681,600 untuk proyek Testing Refactor	2026-08-28 04:31:22.176
1265	1	login	User Damar Muharram berhasil login.	2026-08-28 04:41:41.817
1306	1	login	User Damar Muharram berhasil login.	2026-08-28 07:35:41.386
1308	4	login	User Muhammad Zaini berhasil login.	2026-08-28 07:38:28.297
74	2	login	User Alif Ihsan berhasil login.	2026-08-10 12:44:34.818
1220	8	login	User User Manual berhasil login.	2026-08-27 16:52:53.914
1250	1	login	User Damar Muharram berhasil login.	2026-08-27 17:39:18.055
1264	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 84,000 untuk proyek Testing Refactor	2026-08-28 04:31:22.61
1307	1	login	User Damar Muharram berhasil login.	2026-08-28 07:37:39.631
1309	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 273.000 oleh Muhammad Alvin Ababil	2026-08-28 07:40:24.931
75	4	login	User Muhammad Zaini berhasil login.	2026-08-10 12:45:10.759
76	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-10 13:06:02.284
77	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 191,475 untuk proyek Zaini	2026-08-10 13:06:26.054
78	4	login	User Muhammad Zaini berhasil login.	2026-08-10 13:07:32.705
79	4	login	User Muhammad Zaini berhasil login.	2026-08-10 13:09:50.25
80	4	login	User Muhammad Zaini berhasil login.	2026-08-10 13:17:11.868
81	4	login	User Muhammad Zaini berhasil login.	2026-08-10 13:21:42.841
82	2	login	User Alif Ihsan berhasil login.	2026-08-10 13:21:53.163
83	2	review_pengajuan_anggaran	Direktur menyetujui pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" (Biaya Produksi Proyek) untuk proyek Zaini.	2026-08-10 13:30:16.237
84	2	review_pengajuan_anggaran	Direktur menolak pengajuan "Perubahan alokasi anggaran: Biaya Administrasi Proyek" (Biaya Administrasi Proyek) untuk proyek Zaini. Catatan: Saya juga mau seksdols	2026-08-10 13:30:56.013
85	2	login	User Alif Ihsan berhasil login.	2026-08-10 13:48:01.836
86	4	login	User Muhammad Zaini berhasil login.	2026-08-10 14:11:45.856
87	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-10 14:29:49.767
88	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-10 14:47:01.372
89	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-10 14:53:22.314
90	4	login	User Muhammad Zaini berhasil login.	2026-08-11 01:40:21.688
91	4	login	User Muhammad Zaini berhasil login.	2026-08-11 01:42:06.344
92	2	login	User Alif Ihsan berhasil login.	2026-08-11 02:15:36.699
93	2	login	User Alif Ihsan berhasil login.	2026-08-11 02:31:14.55
94	2	login	User Alif Ihsan berhasil login.	2026-08-11 02:57:33.507
95	4	login	User Muhammad Zaini berhasil login.	2026-08-11 03:00:00.705
96	2	login	User Alif Ihsan berhasil login.	2026-08-11 04:03:59.837
97	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 04:16:26.372
98	1	login	User Damar Muharram berhasil login.	2026-08-11 04:24:48.323
99	1	login	User Damar Muharram berhasil login.	2026-08-11 05:14:11.491
100	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 1)	2026-08-11 05:14:25
101	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 2)	2026-08-11 05:14:26.705
102	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 3)	2026-08-11 05:14:28.156
103	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 4)	2026-08-11 05:14:29.582
104	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 5)	2026-08-11 05:14:30.871
105	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 6)	2026-08-11 05:14:32.397
106	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 7)	2026-08-11 05:14:37.787
107	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 8)	2026-08-11 05:14:39.224
108	1	create_master_data	Super Admin - Menambahkan Master Main baru (pengeluaran): Biaya Marketing Proyek	2026-08-11 05:16:46.268
109	1	create_master_data	Super Admin - Menambahkan Master Main baru (pengeluaran): Biaya Administrasi Proyek	2026-08-11 05:17:02.715
110	1	create_master_data	Super Admin - Menambahkan Master Main baru (pengeluaran): Biaya Produksi Proyek	2026-08-11 05:17:17.815
111	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pengeluaran): Biaya Marketing Proyek	2026-08-11 05:17:25.919
112	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pengeluaran): Biaya Marketing Proyek Lainnya	2026-08-11 05:17:30.655
113	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pengeluaran): Biaya Jaminan Proyek	2026-08-11 05:17:36.738
114	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pengeluaran): Pembuatan Dokumen Kontrak	2026-08-11 05:17:41.071
115	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pengeluaran): Biaya Administrasi Proyek Lainnya	2026-08-11 05:17:45.056
116	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pengeluaran): Biaya Personil	2026-08-11 05:17:50.622
117	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pengeluaran): Biaya Non Personil	2026-08-11 05:17:55.424
118	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pengeluaran): Biaya Pengadaan Barang dan Jasa	2026-08-11 05:18:00.902
119	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pengeluaran): Biaya Garansi	2026-08-11 05:18:05.391
120	2	login	User Alif Ihsan berhasil login.	2026-08-11 05:18:15.75
121	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 05:18:28.081
122	1	create_master_data	Super Admin - Menambahkan Master Main baru (pemasukan): Penjualan Jasa	2026-08-11 05:19:10.384
123	1	create_master_data	Super Admin - Menambahkan Master Main baru (pemasukan): Penjualan Barang	2026-08-11 05:19:20.476
124	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pemasukan): Penjualan Jasa	2026-08-11 05:19:31.793
125	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pemasukan): Diskon Penjualan Jasa	2026-08-11 05:19:35.035
126	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pemasukan): Retur Penjualan Jasa	2026-08-11 05:19:38.794
127	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pemasukan): Biaya Penjualan Jasa Lainnya	2026-08-11 05:19:43.324
128	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pemasukan): Penjualan Barang	2026-08-11 05:19:48.256
129	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pemasukan): Diskon Penjualan Barang	2026-08-11 05:19:52.917
130	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pemasukan): Retur Penjualan Barang	2026-08-11 05:19:56.15
131	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pemasukan): Biaya Penjualan Barang Lainnya	2026-08-11 05:19:59.531
132	2	login	User Alif Ihsan berhasil login.	2026-08-11 05:20:15.938
133	2	create_proyek	Direktur / Manajemen membuat proyek baru: Minggu 7	2026-08-11 05:20:53.116
134	2	assign_project_members	Direktur mengatur ulang anggota proyek Minggu 7 (2 orang)	2026-08-11 05:21:14.255
135	4	login	User Muhammad Zaini berhasil login.	2026-08-11 05:23:28.389
136	2	login	User Alif Ihsan berhasil login.	2026-08-11 05:25:22.689
137	2	input_rab	Direktur menginput RAB proyek Minggu 7 senilai Rp 10,000,000	2026-08-11 05:26:07.619
138	4	login	User Muhammad Zaini berhasil login.	2026-08-11 05:26:39.516
139	2	login	User Alif Ihsan berhasil login.	2026-08-11 05:27:40.499
140	4	alokasi_pos	Project Manager mengalokasikan 4 pos baru pada proyek Minggu 7	2026-08-11 05:28:00.561
141	4	login	User Muhammad Zaini berhasil login.	2026-08-11 05:28:15.078
142	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-11 05:28:23.075
143	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 05:28:59.509
214	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-12 09:07:23.599
144	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 70,000 untuk proyek Minggu 7	2026-08-11 05:34:01.778
145	4	login	User Muhammad Zaini berhasil login.	2026-08-11 05:34:34.413
146	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 70,000 oleh Muhammad Alvin Ababil	2026-08-11 05:34:55.362
147	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 05:35:06.698
148	1	login	User Damar Muharram berhasil login.	2026-08-11 05:38:54.457
149	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 05:49:33.215
150	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 70,000 oleh Muhammad Alvin Ababil. Jurnal Debit: 34, Kredit: 34	2026-08-11 05:54:40.43
151	4	login	User Muhammad Zaini berhasil login.	2026-08-11 05:55:27.29
152	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 05:56:08.282
153	4	login	User Muhammad Zaini berhasil login.	2026-08-11 05:56:45.256
154	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-11 05:57:18.78
155	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 43,500 untuk proyek Minggu 7	2026-08-11 05:57:34.656
156	4	login	User Muhammad Zaini berhasil login.	2026-08-11 05:57:39.105
157	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 05:57:56.193
158	4	login	User Muhammad Zaini berhasil login.	2026-08-11 05:58:12.429
159	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 43,500 oleh Muhammad Alvin Ababil	2026-08-11 05:58:20.419
160	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 05:58:36.556
161	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 43,500 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: 	2026-08-11 06:03:59.248
162	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-11 06:04:13.753
163	4	login	User Muhammad Zaini berhasil login.	2026-08-11 06:04:28.652
164	1	login	User Damar Muharram berhasil login.	2026-08-11 06:06:25.69
166	1	login	User Damar Muharram berhasil login.	2026-08-11 07:12:49.804
167	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 07:13:07.739
168	4	login	User Muhammad Zaini berhasil login.	2026-08-11 07:14:57.344
169	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-11 07:16:58.179
170	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 450.000 untuk proyek Minggu 7	2026-08-11 07:18:00.544
171	4	login	User Muhammad Zaini berhasil login.	2026-08-11 07:18:12.624
172	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 450.000 oleh Muhammad Alvin Ababil	2026-08-11 07:21:07.066
173	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 800.000 untuk proyek Minggu 7	2026-08-11 07:21:31.724
174	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 07:21:50.385
175	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 800.000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: 	2026-08-11 07:22:00.35
176	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 450.000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: 	2026-08-11 07:22:08.394
177	4	login	User Muhammad Zaini berhasil login.	2026-08-11 07:22:37.711
178	2	login	User Alif Ihsan berhasil login.	2026-08-11 07:24:08.883
179	2	review_pengajuan_anggaran	Direktur menyetujui pengajuan "Perubahan alokasi anggaran: Biaya Marketing Proyek" (Biaya Marketing Proyek) untuk proyek Minggu 7.	2026-08-11 07:26:49.864
180	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-11 07:28:32.473
181	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 191,475 untuk proyek Minggu 7	2026-08-11 07:31:03.773
182	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-11 07:33:54.328
183	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 1.000.000 untuk proyek Minggu 7	2026-08-11 07:34:40.945
184	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 681,600 untuk proyek Minggu 7	2026-08-11 07:36:27.374
185	4	login	User Muhammad Zaini berhasil login.	2026-08-11 07:40:45.051
186	2	login	User Alif Ihsan berhasil login.	2026-08-11 07:41:24.337
187	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-11 07:42:21.38
188	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-11 07:42:57.83
189	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 681.600 untuk proyek Minggu 7	2026-08-11 07:43:45.895
190	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 2.000.000.000 untuk proyek Minggu 7	2026-08-11 07:45:56.743
191	2	review_pengajuan_anggaran	Direktur menyetujui pengajuan "Perubahan alokasi anggaran: Biaya Marketing Proyek" (Biaya Marketing Proyek) untuk proyek Minggu 7.	2026-08-11 07:51:13.258
192	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-11 08:48:50.409
193	4	login	User Muhammad Zaini berhasil login.	2026-08-11 09:00:34.043
194	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 09:17:55.218
195	4	login	User Muhammad Zaini berhasil login.	2026-08-11 09:25:20.036
196	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 2.000.000.000 oleh Muhammad Alvin Ababil	2026-08-11 09:25:35.686
197	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 681.600 oleh Muhammad Alvin Ababil	2026-08-11 09:25:42.346
198	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 191.475 oleh Muhammad Alvin Ababil	2026-08-11 09:25:47.751
199	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 681.600 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: 	2026-08-11 09:26:00.482
200	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 191.475 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: 	2026-08-11 09:26:06.131
201	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 681.600 oleh Muhammad Alvin Ababil	2026-08-11 09:26:29.908
202	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 681.600 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: 	2026-08-11 09:26:39.999
203	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-11 13:11:06.011
204	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 13:17:32.086
205	2	login	User Alif Ihsan berhasil login.	2026-08-11 13:48:50.323
206	1	login	User Damar Muharram berhasil login.	2026-08-11 13:57:03.097
207	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-11 14:21:30.681
208	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 2.000.000.000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: 	2026-08-11 14:22:23.274
209	2	login	User Alif Ihsan berhasil login.	2026-08-11 15:28:50.678
210	2	login	User Alif Ihsan berhasil login.	2026-08-12 09:01:15.438
211	2	login	User Alif Ihsan berhasil login.	2026-08-12 09:01:53.343
212	4	login	User Muhammad Zaini berhasil login.	2026-08-12 09:03:54.367
213	2	login	User Alif Ihsan berhasil login.	2026-08-12 09:07:01.845
215	2	login	User Alif Ihsan berhasil login.	2026-08-12 09:11:07.792
216	2	create_proyek	Direktur / Manajemen membuat proyek baru: Zaini 1	2026-08-12 09:11:24.982
217	2	update_project	Direktur memperbarui proyek: Zaini 1 (Status: AKTIF)	2026-08-12 09:11:32.882
218	2	create_proyek	Direktur / Manajemen membuat proyek baru: Zaini 2	2026-08-12 09:11:42.795
219	2	create_proyek	Direktur / Manajemen membuat proyek baru: Zaini 3	2026-08-12 09:11:50.777
220	2	create_proyek	Direktur / Manajemen membuat proyek baru: Zaini 4	2026-08-12 09:11:57.788
221	2	update_project	Direktur memperbarui proyek: Zaini 3 (Status: DONE)	2026-08-12 09:12:13.168
222	2	update_project	Direktur memperbarui proyek: Zaini 4 (Status: CANCELED)	2026-08-12 09:12:18.827
223	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-12 09:12:36.947
224	2	login	User Alif Ihsan berhasil login.	2026-08-12 09:19:28.558
225	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-12 09:27:33.352
226	2	login	User Alif Ihsan berhasil login.	2026-08-12 09:29:31.934
227	4	login	User Muhammad Zaini berhasil login.	2026-08-12 09:31:09.667
228	2	login	User Alif Ihsan berhasil login.	2026-08-12 09:37:11.488
229	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-12 09:40:14.48
230	1	login	User Damar Muharram berhasil login.	2026-08-12 09:41:23.272
231	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 27) menjadi: Biaya Jaminan Proyekk	2026-08-12 09:44:28.416
232	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 27) menjadi: Biaya Jaminan Proyek	2026-08-12 09:44:34.126
233	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 28) menjadi: Pembuatan Dokumen Kontrak	2026-08-12 09:44:38.001
234	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 29) menjadi: Biaya Administrasi Proyek Lainnya	2026-08-12 09:44:40.836
235	1	create_master_data	Super Admin - Menambahkan Master Main baru (pengeluaran): asdf	2026-08-12 09:50:38.281
236	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 14)	2026-08-12 09:50:41.762
237	1	update_master_data	Super Admin - Mengubah Master Main (ID: 12) menjadi: Penjualan Jasaa	2026-08-12 09:55:37.277
238	1	update_master_data	Super Admin - Mengubah Master Main (ID: 12) menjadi: Penjualan Jasa	2026-08-12 09:55:40.813
239	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 25) menjadi: Biaya Marketing Proyek a	2026-08-12 09:56:04.679
240	1	login	User Damar Muharram berhasil login.	2026-08-12 09:56:20.397
241	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 25) menjadi: Biaya Marketing Proyek	2026-08-12 09:56:31.873
242	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 26) menjadi: Biaya Marketing Proyek Lainnya	2026-08-12 09:56:34.226
243	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-12 10:19:49.181
244	2	login	User Alif Ihsan berhasil login.	2026-08-12 10:20:15.46
245	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-12 10:20:22.281
246	4	login	User Muhammad Zaini berhasil login.	2026-08-12 10:20:43.014
247	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-12 10:21:12.636
248	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-12 10:24:05.801
249	4	login	User Muhammad Zaini berhasil login.	2026-08-12 10:25:20.083
250	2	login	User Alif Ihsan berhasil login.	2026-08-12 10:30:17.854
251	1	login	User Damar Muharram berhasil login.	2026-08-12 13:04:20.061
252	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-12 13:18:11.375
253	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-12 13:24:57.371
254	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-12 13:26:40.941
255	2	login	User Alif Ihsan berhasil login.	2026-08-12 13:27:58.299
256	1	login	User Damar Muharram berhasil login.	2026-08-12 13:28:55.336
257	2	login	User Alif Ihsan berhasil login.	2026-08-12 13:31:39.735
258	2	update_project	Direktur memperbarui proyek: Minggu 7 (Status: AKTIF)	2026-08-12 13:31:50.225
259	2	login	User Alif Ihsan berhasil login.	2026-08-12 13:34:00.937
260	2	login	User Alif Ihsan berhasil login.	2026-08-12 13:34:24.975
261	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-12 13:34:50.137
262	1	login	User Damar Muharram berhasil login.	2026-08-12 13:35:19.26
263	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-12 13:36:17.673
264	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 681.600.000 untuk proyek Minggu 7	2026-08-12 13:47:25.811
265	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-12 13:47:49.28
266	4	login	User Muhammad Zaini berhasil login.	2026-08-12 13:48:12.441
267	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 681.600.000 oleh Muhammad Alvin Ababil	2026-08-12 13:48:45.733
268	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-12 13:48:57.44
269	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 681.600.000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: 	2026-08-12 13:49:18.461
270	4	login	User Muhammad Zaini berhasil login.	2026-08-12 13:50:23.513
271	4	login	User Muhammad Zaini berhasil login.	2026-08-12 13:51:03.477
272	4	login	User Muhammad Zaini berhasil login.	2026-08-12 13:54:27.113
273	2	login	User Alif Ihsan berhasil login.	2026-08-12 13:57:22.52
274	1	login	User Damar Muharram berhasil login.	2026-08-12 14:01:20.289
275	4	login	User Muhammad Zaini berhasil login.	2026-08-12 14:01:38.373
276	2	login	User Alif Ihsan berhasil login.	2026-08-12 14:02:02.945
277	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-12 14:10:14.483
278	1	login	User Damar Muharram berhasil login.	2026-08-12 14:15:30.649
279	1	create_master_data	Super Admin - Menambahkan Master Main baru (pengeluaran): aaa	2026-08-12 14:15:45.604
280	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 15)	2026-08-12 14:15:51.151
281	4	login	User Muhammad Zaini berhasil login.	2026-08-12 14:45:21.838
282	1	login	User Damar Muharram berhasil login.	2026-08-12 14:46:31.202
283	2	login	User Alif Ihsan berhasil login.	2026-08-12 15:03:37.254
284	2	login	User Alif Ihsan berhasil login.	2026-08-12 15:12:00.421
285	2	create_proyek	Membuat proyek baru: QA-Isaq 1	2026-08-12 15:14:27.304
286	2	create_proyek	Membuat proyek baru: QA-Isaq2	2026-08-12 15:14:37.599
287	2	create_proyek	Membuat proyek baru: QA-Isaq3	2026-08-12 15:14:47.943
288	2	create_proyek	Membuat proyek baru: QA-Isaq3	2026-08-12 15:15:03.17
289	2	update_project	Direktur memperbarui proyek: QA-Isaq4 (Status: PLANNING)	2026-08-12 15:15:17.79
290	2	create_proyek	Membuat proyek baru: QA-Isaq5	2026-08-12 15:15:45.791
291	1	login	User Damar Muharram berhasil login.	2026-08-12 16:13:24.941
292	2	login	User Alif Ihsan berhasil login.	2026-08-12 17:08:05.398
293	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-12 17:18:04.518
294	4	login	User Muhammad Zaini berhasil login.	2026-08-13 01:23:46.995
295	2	login	User Alif Ihsan berhasil login.	2026-08-13 01:35:39.921
296	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-13 03:13:05.872
297	2	login	User Alif Ihsan berhasil login.	2026-08-13 03:15:17.081
298	4	login	User Muhammad Zaini berhasil login.	2026-08-13 03:38:12.454
299	2	login	User Alif Ihsan berhasil login.	2026-08-13 03:59:37.725
300	2	input_rab	Direktur menginput RAB proyek QA-Isaq 1 senilai Rp 200.000.000	2026-08-13 04:12:57.116
301	2	input_rab	Direktur menginput RAB proyek QA-Isaq2 senilai Rp 200.000.000	2026-08-13 04:13:51.28
302	2	input_rab	Direktur menginput RAB proyek QA-Isaq3 senilai Rp 200.000.000	2026-08-13 04:14:03.291
303	2	input_rab	Direktur menginput RAB proyek QA-Isaq4 senilai Rp 200.000.000	2026-08-13 04:14:29.742
304	1	login	User Damar Muharram berhasil login.	2026-08-13 04:17:07.98
305	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 33) menjadi: Biaya Garansi tes rename	2026-08-13 04:25:39.383
306	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 33) menjadi: Biaya Garansi	2026-08-13 04:25:47.211
307	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 30) menjadi: Biaya Personil tes rename	2026-08-13 04:25:55.123
308	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 30) menjadi: Biaya Personil	2026-08-13 04:26:04.104
309	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 31) menjadi: Biaya Non Personil tes rename	2026-08-13 04:27:34.043
310	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 31) menjadi: Biaya Non Personil	2026-08-13 04:27:41.381
311	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 32) menjadi: Biaya Pengadaan Barang dan Jasa tes rename	2026-08-13 04:27:50.232
312	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 32) menjadi: Biaya Pengadaan Barang dan Jasa	2026-08-13 04:27:56.072
313	1	update_master_data	Super Admin - Mengubah Master Main (ID: 11) menjadi: Biaya Produksi Proyek tes rename	2026-08-13 04:29:59.923
314	1	update_master_data	Super Admin - Mengubah Master Main (ID: 11) menjadi: Biaya Produksi Proyek	2026-08-13 04:30:06.291
315	1	update_master_data	Super Admin - Mengubah Master Main (ID: 9) menjadi: Biaya Marketing Proyek tes rename	2026-08-13 04:31:57.342
316	1	update_master_data	Super Admin - Mengubah Master Main (ID: 9) menjadi: Biaya Marketing Proyek	2026-08-13 04:32:02.13
317	1	update_master_data	Super Admin - Mengubah Master Main (ID: 12) menjadi: Penjualan Jasa tes rename	2026-08-13 04:32:09.62
318	1	update_master_data	Super Admin - Mengubah Master Main (ID: 12) menjadi: Penjualan Jasa	2026-08-13 04:32:14.122
319	4	login	User Muhammad Zaini berhasil login.	2026-08-13 04:32:54.664
320	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-13 04:33:34.614
321	1	create_master_data	Super Admin - Menambahkan Master Main baru (pengeluaran): Tes Tambah Main	2026-08-13 04:39:04.722
322	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 16)	2026-08-13 04:39:14.255
323	2	login	User Alif Ihsan berhasil login.	2026-08-13 04:41:09.831
324	2	update_project	Direktur memperbarui proyek: Minggu 7 (Status: AKTIF)	2026-08-13 04:41:18.398
325	1	create_master_data	Super Admin - Menambahkan Master Main baru (pengeluaran): tes tambah main	2026-08-13 04:41:51.05
326	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 17)	2026-08-13 04:42:00.203
327	1	create_master_data	Super Admin - Menambahkan Master Main baru (pengeluaran): tes main baru	2026-08-13 04:46:39.114
328	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 18)	2026-08-13 04:46:44.499
329	1	create_master_data	Super Admin - Menambahkan Master Main baru (pengeluaran): tes	2026-08-13 04:50:32.464
330	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 19)	2026-08-13 04:50:36.237
331	2	input_rab	Direktur menginput RAB proyek QA-Isaq5 senilai Rp 100.000.000	2026-08-13 05:01:51.198
332	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-13 05:06:51.85
333	1	login	User Damar Muharram berhasil login.	2026-08-13 05:07:22.575
334	1	create_master_data	Super Admin - Menambahkan Master Main baru (pemasukan): tes	2026-08-13 05:15:18.049
335	1	create_master_data	Super Admin - Menambahkan Master Sub baru (pemasukan): tes	2026-08-13 05:15:23.338
336	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 42) menjadi: tes 2	2026-08-13 05:15:30.227
337	1	delete_master_data	Super Admin - Menghapus Master Sub (ID: 42)	2026-08-13 05:15:33.499
338	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 20)	2026-08-13 05:15:36.461
339	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-13 09:04:34.589
340	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 96.000 untuk proyek Minggu 7	2026-08-13 09:08:23.817
341	4	login	User Muhammad Zaini berhasil login.	2026-08-13 09:10:22.819
342	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 96.000 oleh Muhammad Alvin Ababil	2026-08-13 09:10:46.596
343	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-13 09:11:17.144
344	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 96.000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Penjualan Jasa > SUB · apap	2026-08-13 09:11:37.913
345	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-13 09:11:59.819
346	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 681.600 untuk proyek Minggu 7	2026-08-13 09:23:26.332
347	4	login	User Muhammad Zaini berhasil login.	2026-08-13 09:27:04.785
348	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-13 09:28:23.191
349	4	login	User Muhammad Zaini berhasil login.	2026-08-13 09:29:32.469
350	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-13 09:30:24.242
351	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-13 09:32:01.628
352	4	login	User Muhammad Zaini berhasil login.	2026-08-13 09:32:23.642
353	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 681.600 oleh Muhammad Alvin Ababil	2026-08-13 09:33:27.169
354	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-13 09:33:56.275
355	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 681.600 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Penjualan Jasa > SUB · apap	2026-08-13 09:37:27.841
356	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-13 09:37:41.687
357	1	login	User Damar Muharram berhasil login.	2026-08-13 09:39:48.492
358	1	update_project	Super Admin memperbarui proyek: QA-Isaq 1 (Status: AKTIF)	2026-08-13 09:42:35.011
359	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-13 09:42:53.208
360	2	login	User Alif Ihsan berhasil login.	2026-08-13 11:42:20.258
361	1	login	User Damar Muharram berhasil login.	2026-08-13 11:43:11.466
362	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-13 12:11:13.788
363	4	login	User Muhammad Zaini berhasil login.	2026-08-13 12:11:30.731
364	2	login	User Alif Ihsan berhasil login.	2026-08-13 12:12:29.369
1221	8	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 5,000,000 untuk proyek Last Testing	2026-08-27 16:56:32.087
1251	2	login	User Alif Ihsan berhasil login.	2026-08-27 17:48:49.12
1266	2	login	User Alif Ihsan berhasil login.	2026-08-28 06:23:25.187
1267	2	create_proyek	Membuat proyek baru: Proyek A dengan nilai Rp 100.000.000	2026-08-28 06:24:09.617
1268	2	update_project	Direktur memperbarui proyek: p (Status: AKTIF, Nilai: Rp 100.000.000)	2026-08-28 06:24:26.761
1269	2	input_rab	Mengatur budget proyek Proyek Baru: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 30.000.000	2026-08-28 06:25:28.414
1310	1	login	User Damar Muharram berhasil login.	2026-08-28 07:44:25.864
365	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-13 12:13:23.152
366	1	login	User Damar Muharram berhasil login.	2026-08-13 12:14:40.364
367	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-13 13:05:19.396
368	2	login	User Alif Ihsan berhasil login.	2026-08-13 13:07:03.31
369	1	login	User Damar Muharram berhasil login.	2026-08-13 13:09:48.721
370	2	login	User Alif Ihsan berhasil login.	2026-08-13 13:10:09.048
371	1	login	User Damar Muharram berhasil login.	2026-08-13 13:11:12.398
372	2	login	User Alif Ihsan berhasil login.	2026-08-13 13:11:36.959
373	2	login	User Alif Ihsan berhasil login.	2026-08-13 13:13:13.702
374	2	login	User Alif Ihsan berhasil login.	2026-08-13 13:14:10.541
375	1	login	User Damar Muharram berhasil login.	2026-08-13 13:18:35.101
376	4	login	User Muhammad Zaini berhasil login.	2026-08-13 13:19:44.436
377	4	login	User Muhammad Zaini berhasil login.	2026-08-13 13:23:55.489
378	2	login	User Alif Ihsan berhasil login.	2026-08-13 13:24:18.134
379	2	login	User Alif Ihsan berhasil login.	2026-08-13 13:25:01.301
380	4	login	User Muhammad Zaini berhasil login.	2026-08-13 13:26:08.342
381	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-13 13:31:10.668
382	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 26) menjadi: Biaya Marketing Proyek Lainnya tes	2026-08-13 13:36:05.243
383	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 26) menjadi: Biaya Marketing Proyek Lainnya	2026-08-13 13:36:17.108
384	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 30) menjadi: Biaya Personil tes	2026-08-13 13:36:31.098
385	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 30) menjadi: Biaya Personil	2026-08-13 13:36:38.618
386	1	create_master_data	Super Admin - Menambahkan Master Main baru (pemasukan): Tes pemasukan	2026-08-13 13:37:20.495
387	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 21)	2026-08-13 13:37:27.722
388	1	create_master_data	Super Admin - Menambahkan Master Main baru (pengeluaran): tes pengeluaran	2026-08-13 13:37:32.28
389	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 22)	2026-08-13 13:37:37.041
390	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-13 13:39:00.762
391	4	login	User Muhammad Zaini berhasil login.	2026-08-13 13:39:34.21
392	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-13 13:43:38.28
393	2	login	User Alif Ihsan berhasil login.	2026-08-13 13:44:07.317
394	4	login	User Muhammad Zaini berhasil login.	2026-08-13 13:49:55.162
395	2	login	User Alif Ihsan berhasil login.	2026-08-13 13:50:45.381
396	4	login	User Muhammad Zaini berhasil login.	2026-08-13 14:19:45.736
397	4	login	User Muhammad Zaini berhasil login.	2026-08-13 14:21:14.38
398	2	login	User Alif Ihsan berhasil login.	2026-08-17 10:20:26.437
399	2	create_proyek	Membuat proyek baru: Minggu 8	2026-08-17 10:33:07.199
400	2	assign_project_members	Direktur mengatur ulang anggota proyek Minggu 8 (1 orang)	2026-08-17 10:37:34.286
401	4	login	User Muhammad Zaini berhasil login.	2026-08-17 10:37:47.427
402	2	login	User Alif Ihsan berhasil login.	2026-08-17 10:39:35.378
403	2	create_proyek	Membuat proyek baru: Minggu 8 dengan nilai Rp 10.000.000	2026-08-17 11:11:16.503
404	2	update_project	Direktur memperbarui proyek: Minggu 8 (Status: AKTIF, Nilai: Rp 1.000.000)	2026-08-17 11:13:01.924
405	2	update_project	Direktur memperbarui proyek: Minggu 8 (Status: AKTIF, Nilai: Rp 10.000.000)	2026-08-17 11:13:10.48
406	2	assign_project_members	Direktur mengatur ulang anggota proyek Minggu 8 (1 orang)	2026-08-17 11:13:21.692
407	4	login	User Muhammad Zaini berhasil login.	2026-08-17 11:15:02.926
408	2	login	User Alif Ihsan berhasil login.	2026-08-17 11:15:56.713
409	2	input_rab	Direktur menginput RAB proyek Minggu 8 senilai Rp 10,000,000	2026-08-17 12:55:05.83
410	4	login	User Muhammad Zaini berhasil login.	2026-08-17 12:55:11.456
411	4	alokasi_pos	Project Manager mengalokasikan 2 pos baru pada proyek Minggu 8	2026-08-17 12:56:09.016
412	2	login	User Alif Ihsan berhasil login.	2026-08-17 12:56:23.302
413	4	login	User Muhammad Zaini berhasil login.	2026-08-17 12:56:44.312
414	2	login	User Alif Ihsan berhasil login.	2026-08-17 12:58:08.2
415	2	login	User Alif Ihsan berhasil login.	2026-08-17 13:07:47.926
416	4	login	User Muhammad Zaini berhasil login.	2026-08-17 13:11:44.078
417	2	login	User Alif Ihsan berhasil login.	2026-08-17 13:19:03.254
418	4	login	User Muhammad Zaini berhasil login.	2026-08-17 13:40:21.437
419	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-17 13:44:30.592
420	2	login	User Alif Ihsan berhasil login.	2026-08-17 13:44:38.4
421	2	assign_project_members	Direktur mengatur ulang anggota proyek Minggu 8 (2 orang)	2026-08-17 13:45:36.452
422	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-17 13:46:22.394
423	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 1,000 untuk proyek Minggu 8	2026-08-17 13:47:15.065
424	4	login	User Muhammad Zaini berhasil login.	2026-08-17 13:47:20.089
425	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 1,000 oleh Muhammad Alvin Ababil	2026-08-17 13:47:30.034
426	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-17 13:47:36.962
427	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 1,000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Penjualan Jasa > SUB · Diskon Penjualan Jasa	2026-08-17 13:48:08.566
428	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-17 13:48:19.45
429	2	login	User Alif Ihsan berhasil login.	2026-08-17 13:52:04.033
430	4	login	User Muhammad Zaini berhasil login.	2026-08-17 13:52:15.806
431	2	login	User Alif Ihsan berhasil login.	2026-08-17 13:52:25.02
432	4	login	User Muhammad Zaini berhasil login.	2026-08-17 13:54:14.916
433	2	login	User Alif Ihsan berhasil login.	2026-08-17 14:03:46.865
434	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-17 14:04:55.45
435	4	login	User Muhammad Zaini berhasil login.	2026-08-17 14:05:03.461
436	2	login	User Alif Ihsan berhasil login.	2026-08-17 14:07:13.087
437	4	login	User Muhammad Zaini berhasil login.	2026-08-17 14:31:13.659
438	2	login	User Alif Ihsan berhasil login.	2026-08-17 14:31:22.412
439	4	login	User Muhammad Zaini berhasil login.	2026-08-17 14:40:42.253
440	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-17 14:41:43.411
441	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 43,500 untuk proyek Minggu 8	2026-08-17 14:41:58.756
442	4	login	User Muhammad Zaini berhasil login.	2026-08-17 14:42:02.97
443	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 43,500 oleh Muhammad Alvin Ababil	2026-08-17 14:42:10.94
444	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-17 14:42:15.616
445	4	login	User Muhammad Zaini berhasil login.	2026-08-17 14:42:39.978
447	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-17 14:44:07.707
449	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-17 14:45:19.904
1224	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 1,700,000 untuk proyek Last Testing	2026-08-27 16:59:38.025
1225	4	login	User Muhammad Zaini berhasil login.	2026-08-27 16:59:42.991
1226	8	login	User User Manual berhasil login.	2026-08-27 16:59:49.687
1231	2	login	User Alif Ihsan berhasil login.	2026-08-27 17:03:32.451
1234	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 17:04:30.407
1241	3	realisasi_pemasukan	Tim Keuangan merealisasikan pemasukan Retur Penjualan Jasa "Pengembalian Dana Karyawan" sebesar Rp 10.000.000 pada proyek: Last Testing	2026-08-27 17:18:58.973
1243	2	login	User Alif Ihsan berhasil login.	2026-08-27 17:19:15.886
1252	2	create_proyek	Membuat proyek baru: p dengan nilai Rp 1.000.000	2026-08-27 17:58:28.154
1255	2	update_project	Direktur memperbarui proyek: UAT Direktur (Status: DONE, Nilai: Rp 100.000.000)	2026-08-27 18:00:44.085
1270	2	input_rab	Mengatur budget proyek Proyek Baru: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 30.000.000	2026-08-28 06:25:50.981
1271	2	assign_project_members	Direktur mengatur ulang anggota proyek Proyek Baru (1 orang)	2026-08-28 06:26:42.581
1276	4	assign_project_members	Project Manager mengatur ulang anggota proyek Proyek Baru (2 orang)	2026-08-28 06:30:01.18
1283	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 70,000 oleh Muhammad Alvin Ababil	2026-08-28 06:33:35.589
1285	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-28 06:34:10.609
1287	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-28 06:35:02.637
1300	2	review_pengajuan_anggaran	Direktur menyetujui pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" (Biaya Produksi Proyek) untuk proyek Proyek Baru.	2026-08-28 06:40:48.877
1311	4	login	User Muhammad Zaini berhasil login.	2026-08-28 07:48:59.206
446	2	login	User Alif Ihsan berhasil login.	2026-08-17 14:43:00.672
448	4	login	User Muhammad Zaini berhasil login.	2026-08-17 14:44:25.062
450	1	login	User Damar Muharram berhasil login.	2026-08-17 14:49:09.227
451	2	login	User Alif Ihsan berhasil login.	2026-08-17 14:49:20.976
452	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-17 14:49:23.824
453	2	login	User Alif Ihsan berhasil login.	2026-08-17 14:53:32.448
454	2	login	User Alif Ihsan berhasil login.	2026-08-17 15:28:12.179
455	4	login	User Muhammad Zaini berhasil login.	2026-08-17 15:32:20.442
456	2	login	User Alif Ihsan berhasil login.	2026-08-17 15:34:28.907
457	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-17 15:42:50.846
458	2	login	User Alif Ihsan berhasil login.	2026-08-17 15:43:10.768
459	2	create_proyek	Membuat proyek baru: test 1 dengan nilai Rp 10.000.000	2026-08-17 16:59:42.46
460	4	login	User Muhammad Zaini berhasil login.	2026-08-17 22:52:23.484
461	2	login	User Alif Ihsan berhasil login.	2026-08-17 23:07:26.073
462	4	login	User Muhammad Zaini berhasil login.	2026-08-17 23:08:25.083
463	2	login	User Alif Ihsan berhasil login.	2026-08-17 23:18:30.401
464	4	login	User Muhammad Zaini berhasil login.	2026-08-17 23:20:28.684
465	1	login	User Damar Muharram berhasil login.	2026-08-17 23:40:58.519
466	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-18 02:34:58.622
467	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-18 06:39:25.865
468	4	login	User Muhammad Zaini berhasil login.	2026-08-18 08:11:41.853
469	4	login	User Muhammad Zaini berhasil login.	2026-08-18 08:16:33.819
470	2	login	User Alif Ihsan berhasil login.	2026-08-18 08:38:24.054
471	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 875.000 untuk proyek Minggu 8	2026-08-18 08:51:30.932
472	4	reject_pengajuan	PM menolak pengajuan Reimbursement Rp 875.000 oleh Muhammad Alvin Ababil	2026-08-18 08:52:31.454
473	2	login	User Alif Ihsan berhasil login.	2026-08-18 09:09:29.026
474	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-18 09:09:38.381
475	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-18 10:55:40.189
476	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 84.000 untuk proyek Minggu 8	2026-08-18 11:53:56.19
477	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 205.268 untuk proyek Minggu 8	2026-08-18 11:54:00.226
478	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 26.000 untuk proyek Minggu 8	2026-08-18 11:54:03.682
479	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 681.600 untuk proyek Minggu 8	2026-08-18 11:54:05.902
480	4	login	User Muhammad Zaini berhasil login.	2026-08-18 12:04:27.28
481	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-18 12:05:44.065
482	4	login	User Muhammad Zaini berhasil login.	2026-08-18 12:29:11.277
483	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-18 12:38:55.043
484	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-18 13:38:31.642
485	4	login	User Muhammad Zaini berhasil login.	2026-08-18 13:56:07.684
486	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-18 13:59:44.697
487	4	login	User Muhammad Zaini berhasil login.	2026-08-18 14:12:02.012
488	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-18 14:14:35.883
489	3	alokasi_pos	Tim Keuangan mengalokasikan 2 pos baru pada proyek Minggu 8	2026-08-18 14:17:14.351
490	2	login	User Alif Ihsan berhasil login.	2026-08-18 14:19:37.372
491	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-18 14:19:47.054
492	4	login	User Muhammad Zaini berhasil login.	2026-08-18 14:19:58.339
493	3	edit_alokasi	Tim Keuangan mengedit alokasi sub id=19 pada proyek 13 menjadi Rp 20.000	2026-08-18 14:20:32.464
494	4	login	User Muhammad Zaini berhasil login.	2026-08-18 14:21:03.999
495	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-18 14:24:41.086
496	3	edit_alokasi	Tim Keuangan mengedit alokasi main id=18 pada proyek 13 menjadi Rp 1.000.000	2026-08-18 14:25:17.984
497	2	login	User Alif Ihsan berhasil login.	2026-08-18 14:26:07.104
498	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-18 14:57:12.493
499	4	login	User Muhammad Zaini berhasil login.	2026-08-18 14:58:40.588
500	4	login	User Muhammad Zaini berhasil login.	2026-08-18 15:02:03.373
501	1	login	User Damar Muharram berhasil login.	2026-08-18 15:13:55.818
502	2	login	User Alif Ihsan berhasil login.	2026-08-18 15:15:25.159
503	1	login	User Damar Muharram berhasil login.	2026-08-18 15:16:21.282
504	1	login	User Damar Muharram berhasil login.	2026-08-18 15:17:02.493
505	1	login	User Damar Muharram berhasil login.	2026-08-18 15:24:00.46
506	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-18 15:27:11.02
507	4	login	User Muhammad Zaini berhasil login.	2026-08-18 15:28:29.038
508	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-18 15:28:58.425
509	2	login	User Alif Ihsan berhasil login.	2026-08-18 15:29:26.275
510	4	login	User Muhammad Zaini berhasil login.	2026-08-18 17:01:28.974
511	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-18 17:06:04.649
512	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-19 06:32:29.511
513	4	login	User Muhammad Zaini berhasil login.	2026-08-19 07:45:17.22
514	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 26.000 oleh Muhammad Alvin Ababil	2026-08-19 07:45:47.449
515	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-19 07:45:53.793
516	2	login	User Alif Ihsan berhasil login.	2026-08-19 12:15:18.603
517	2	update_project	Direktur memperbarui proyek: Minggu 8 (Status: AKTIF, Nilai: Rp 15.000.000)	2026-08-19 12:17:56.855
518	4	login	User Muhammad Zaini berhasil login.	2026-08-19 12:56:37.985
519	2	login	User Alif Ihsan berhasil login.	2026-08-19 13:03:52.271
520	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-19 13:10:26.812
521	4	login	User Muhammad Zaini berhasil login.	2026-08-19 13:13:31.891
522	3	alokasi_pos	Tim Keuangan mengalokasikan 1 pos baru pada proyek Minggu 8	2026-08-19 13:13:38.195
523	3	edit_alokasi	Tim Keuangan mengedit alokasi sub id=21 pada proyek 13 menjadi Rp 96.000	2026-08-19 13:13:58.012
524	3	edit_alokasi	Tim Keuangan mengedit alokasi main id=18 pada proyek 13 menjadi Rp 1.100.000	2026-08-19 13:14:50.795
525	2	login	User Alif Ihsan berhasil login.	2026-08-19 13:15:16.424
526	2	login	User Alif Ihsan berhasil login.	2026-08-19 13:22:28.617
527	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-19 13:25:44.575
528	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 84.000 untuk proyek Minggu 8	2026-08-19 13:32:31.469
529	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 205.268 untuk proyek Minggu 8	2026-08-19 13:32:39.943
530	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 96.000 untuk proyek Minggu 8	2026-08-19 13:32:53.772
531	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 681.600 untuk proyek Minggu 8	2026-08-19 13:32:58.043
532	4	login	User Muhammad Zaini berhasil login.	2026-08-19 13:36:06.903
533	2	login	User Alif Ihsan berhasil login.	2026-08-19 13:44:40.013
534	2	create_proyek	Membuat proyek baru: test 1 dengan nilai Rp 10.000.000	2026-08-19 13:57:16.623
535	2	login	User Alif Ihsan berhasil login.	2026-08-19 14:06:13.734
536	4	login	User Muhammad Zaini berhasil login.	2026-08-19 14:06:28.4
537	2	login	User Alif Ihsan berhasil login.	2026-08-20 08:37:22.611
538	2	create_proyek	Membuat proyek baru: Zaini dengan nilai Rp 10.000.000	2026-08-20 08:38:15.532
539	2	update_project	Direktur memperbarui proyek: Aplikasi Netflix (Status: PLANNING, Nilai: Rp 10.000.000)	2026-08-20 08:41:38.598
540	2	input_rab	Direktur menginput RAB proyek Aplikasi Netflix senilai Rp 6,000,000	2026-08-20 08:53:13.624
541	2	input_rab	Direktur menginput RAB proyek Aplikasi Netflix senilai Rp 7,000,000	2026-08-20 08:55:02.205
542	2	input_rab	Direktur menginput RAB proyek Aplikasi Netflix senilai Rp NaN	2026-08-20 08:59:23.753
543	2	input_rab	Direktur menginput RAB proyek Aplikasi Netflix senilai Rp 4,000,000	2026-08-20 09:02:35.713
544	2	input_rab	Direktur menginput RAB proyek Aplikasi Netflix senilai Rp 7,000,000	2026-08-20 09:03:00.836
545	2	update_project	Direktur memperbarui proyek: Aplikasi Netflix (Status: PLANNING, Nilai: Rp 15.000.000)	2026-08-20 09:11:13.45
546	2	update_project	Direktur memperbarui proyek: Aplikasi Netflix (Status: PLANNING, Nilai: Rp 10.000.000)	2026-08-20 09:11:28.129
547	2	create_proyek	Membuat proyek baru: test dengan nilai Rp 10	2026-08-20 09:43:46.511
548	2	assign_project_members	Direktur mengatur ulang anggota proyek Aplikasi Netflix (2 orang)	2026-08-20 10:03:06.63
549	4	login	User Muhammad Zaini berhasil login.	2026-08-20 10:06:25.296
550	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 10:06:50.861
551	2	login	User Alif Ihsan berhasil login.	2026-08-20 10:14:32.294
552	4	login	User Muhammad Zaini berhasil login.	2026-08-20 10:40:29.814
553	4	alokasi_pos	Project Manager mengalokasikan 5 pos baru pada proyek Aplikasi Netflix	2026-08-20 10:52:38.593
554	4	login	User Muhammad Zaini berhasil login.	2026-08-20 10:53:15.051
555	2	login	User Alif Ihsan berhasil login.	2026-08-20 10:53:24.17
556	2	update_project	Direktur memperbarui proyek: Aplikasi Netflix (Status: AKTIF, Nilai: Rp 10.000.000)	2026-08-20 10:53:40.682
557	4	login	User Muhammad Zaini berhasil login.	2026-08-20 10:53:54.278
558	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 500,000 untuk proyek Aplikasi Netflix	2026-08-20 10:54:19.87
559	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 500,000 untuk proyek Aplikasi Netflix	2026-08-20 10:54:51.622
560	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 500,000 untuk proyek Aplikasi Netflix	2026-08-20 10:55:41.066
561	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-20 10:55:53.145
562	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 50,000 untuk proyek Aplikasi Netflix	2026-08-20 10:59:36.932
563	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 380,000 untuk proyek Aplikasi Netflix	2026-08-20 11:00:15.41
564	4	login	User Muhammad Zaini berhasil login.	2026-08-20 11:00:21.684
565	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 380,000 oleh Muhammad Alvin Ababil	2026-08-20 11:00:36.825
566	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 50,000 oleh Muhammad Alvin Ababil	2026-08-20 11:00:45.407
567	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 11:00:51.817
568	1	login	User Damar Muharram berhasil login.	2026-08-20 11:01:50.013
569	1	create_master_data	Super Admin - Menambahkan Master Main baru (aset): Cash	2026-08-20 11:14:32.693
570	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 23)	2026-08-20 11:14:40.551
571	1	create_master_data	Super Admin - Menambahkan Master Main baru (aset): Bank	2026-08-20 11:14:52.089
572	1	create_master_data	Super Admin - Menambahkan Master Sub baru (aset): Bank BJB	2026-08-20 11:15:00.929
573	1	create_master_data	Super Admin - Menambahkan Master Sub baru (aset): Bank Mandiri	2026-08-20 11:15:07.295
574	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 11:15:39.175
575	4	login	User Muhammad Zaini berhasil login.	2026-08-20 11:21:44.591
576	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 11:25:34.627
577	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 380,000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-20 11:27:09.451
578	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 50,000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-20 11:27:18.214
579	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 500,000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-20 11:27:24.679
580	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 500,000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-20 11:27:30.633
581	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 500,000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-20 11:27:51.348
582	2	login	User Alif Ihsan berhasil login.	2026-08-20 11:28:02.833
583	4	login	User Muhammad Zaini berhasil login.	2026-08-20 11:34:29.388
584	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 11:45:28.906
585	1	login	User Damar Muharram berhasil login.	2026-08-20 11:55:36.494
586	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 29)	2026-08-20 11:56:06.818
587	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 30)	2026-08-20 11:56:09.24
588	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 26)	2026-08-20 11:56:19.073
589	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 27)	2026-08-20 11:56:21.59
590	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 28)	2026-08-20 11:56:23.23
591	2	login	User Alif Ihsan berhasil login.	2026-08-20 11:56:29.177
592	2	input_rab	Direktur menginput RAB proyek Aplikasi Netflix senilai Rp NaN	2026-08-20 11:57:53.405
593	2	input_rab	Direktur menginput RAB proyek Aplikasi Netflix senilai Rp NaN	2026-08-20 11:58:21.51
594	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 11:58:54.685
595	4	login	User Muhammad Zaini berhasil login.	2026-08-20 12:02:24.732
596	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 12:05:02.073
597	3	alokasi_pos	Tim Keuangan mengalokasikan 2 pos baru pada proyek Aplikasi Netflix	2026-08-20 12:35:51.745
598	2	login	User Alif Ihsan berhasil login.	2026-08-20 12:36:07.239
599	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 12:42:12.657
600	2	login	User Alif Ihsan berhasil login.	2026-08-20 12:47:21.223
601	2	create_proyek	Membuat proyek baru: Aplikasi Figma dengan nilai Rp 10.000.000	2026-08-20 12:47:50.233
602	2	input_rab	Direktur menginput RAB proyek Aplikasi Figma senilai Rp 6,000,000	2026-08-20 12:48:25.826
603	2	input_rab	Direktur menginput RAB proyek Aplikasi Figma senilai Rp NaN	2026-08-20 12:48:38.984
604	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 12:49:01.663
605	2	login	User Alif Ihsan berhasil login.	2026-08-20 12:49:21.721
606	2	update_project	Direktur memperbarui proyek: Aplikasi Figma (Status: AKTIF, Nilai: Rp 10.000.000)	2026-08-20 12:49:28.139
607	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 12:49:36.402
608	3	alokasi_pos	Tim Keuangan mengalokasikan 1 pos baru pada proyek Aplikasi Figma	2026-08-20 12:49:48.454
609	3	realisasi_pemasukan	Tim Keuangan merealisasikan pemasukan Retur Penjualan Barang "Pengembalian Uang Dais" sebesar Rp 1.000.000 pada proyek: Aplikasi Figma	2026-08-20 12:50:27.989
610	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 12:50:41.992
611	3	realisasi_pemasukan	Tim Keuangan merealisasikan pemasukan Retur Penjualan Jasa "Pengembalian Uang Pelatihan" sebesar Rp 1.000.000 pada proyek: Aplikasi Netflix	2026-08-20 12:51:13.451
612	2	login	User Alif Ihsan berhasil login.	2026-08-20 12:51:38.869
613	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 12:52:42.718
614	2	login	User Alif Ihsan berhasil login.	2026-08-20 12:53:14.227
615	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 12:54:32.58
616	2	login	User Alif Ihsan berhasil login.	2026-08-20 12:54:45.332
617	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 12:55:49.389
618	2	login	User Alif Ihsan berhasil login.	2026-08-20 12:56:07.13
619	2	update_project	Direktur memperbarui proyek: Aplikasi Netflix (Status: Active)	2026-08-20 12:56:18.848
620	2	input_rab	Direktur menginput RAB proyek Aplikasi Netflix senilai Rp NaN	2026-08-20 12:56:37.029
621	2	create_proyek	Membuat proyek baru: a dengan nilai Rp 10.000.000	2026-08-20 12:57:50.461
622	2	input_rab	Direktur menginput RAB proyek a senilai Rp 6,000,000	2026-08-20 12:58:07.977
623	2	input_rab	Direktur menginput RAB proyek a senilai Rp NaN	2026-08-20 12:58:17.642
624	2	update_project	Direktur memperbarui proyek: a (Status: DONE, Nilai: Rp 10.000.000)	2026-08-20 12:59:15.7
625	2	create_proyek	Membuat proyek baru: b dengan nilai Rp 10.000.000	2026-08-20 13:02:59.457
626	2	input_rab	Direktur menginput RAB proyek b senilai Rp 6,000,000	2026-08-20 13:03:17.798
627	2	input_rab	Direktur menginput RAB proyek b senilai Rp NaN	2026-08-20 13:03:28.327
628	2	login	User Alif Ihsan berhasil login.	2026-08-20 13:03:54.568
629	2	assign_project_members	Direktur mengatur ulang anggota proyek b (1 orang)	2026-08-20 13:04:13.155
630	4	login	User Muhammad Zaini berhasil login.	2026-08-20 13:04:18.895
631	4	alokasi_pos	Project Manager mengalokasikan 2 pos baru pada proyek b	2026-08-20 13:04:45.639
632	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 600,000 untuk proyek b	2026-08-20 13:05:10.673
633	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 13:05:22.237
634	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 600,000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-20 13:05:33.007
635	2	login	User Alif Ihsan berhasil login.	2026-08-20 13:05:44.057
636	2	update_project	Direktur memperbarui proyek: b (Status: DONE, Nilai: Rp 10.000.000)	2026-08-20 13:06:12.275
637	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 13:07:23.275
638	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 13:07:36.59
639	2	login	User Alif Ihsan berhasil login.	2026-08-20 13:08:08.1
640	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 13:08:36.376
641	2	login	User Alif Ihsan berhasil login.	2026-08-20 13:18:28.955
642	2	create_proyek	Membuat proyek baru: Aplikasi Monitoring SPPG dengan nilai Rp 1.000.000.000	2026-08-20 13:20:53.049
643	2	input_rab	Direktur menginput RAB proyek Aplikasi Monitoring SPPG senilai Rp 700,000,000	2026-08-20 13:23:18.317
644	2	input_rab	Direktur menginput RAB proyek Aplikasi Monitoring SPPG senilai Rp NaN	2026-08-20 13:23:52.788
645	4	login	User Muhammad Zaini berhasil login.	2026-08-20 13:24:04.893
646	2	login	User Alif Ihsan berhasil login.	2026-08-20 13:24:09.905
647	2	assign_project_members	Direktur mengatur ulang anggota proyek Aplikasi Monitoring SPPG (2 orang)	2026-08-20 13:24:24.304
648	4	login	User Muhammad Zaini berhasil login.	2026-08-20 13:24:32.699
649	4	alokasi_pos	Project Manager mengalokasikan 7 pos baru pada proyek Aplikasi Monitoring SPPG	2026-08-20 13:28:09.335
650	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 20,000,000 untuk proyek Aplikasi Monitoring SPPG	2026-08-20 13:28:51.879
651	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 2,000,000 untuk proyek Aplikasi Monitoring SPPG	2026-08-20 13:29:05.599
652	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 20,000 untuk proyek Aplikasi Monitoring SPPG	2026-08-20 13:29:20.973
653	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 50,000,000 untuk proyek Aplikasi Monitoring SPPG	2026-08-20 13:29:44.52
654	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-20 13:29:56.488
655	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 38,000,000 untuk proyek Aplikasi Monitoring SPPG	2026-08-20 13:30:22.466
656	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 7,000,000 untuk proyek Aplikasi Monitoring SPPG	2026-08-20 13:30:56.37
657	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 13:31:02.658
658	4	login	User Muhammad Zaini berhasil login.	2026-08-20 13:31:11.61
659	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 7,000,000 oleh Muhammad Alvin Ababil	2026-08-20 13:31:19.629
660	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 38,000,000 oleh Muhammad Alvin Ababil	2026-08-20 13:31:24.444
661	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 13:31:29.808
662	1	login	User Damar Muharram berhasil login.	2026-08-20 13:31:50.329
663	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 13:31:57.927
664	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 7,000,000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-20 13:32:05.852
758	2	input_rab	Mengatur budget proyek Aplikasi X: Nilai Kontrak Rp 100.000.000, RAB Pengeluaran Rp 0	2026-08-21 07:20:48.055
665	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 38,000,000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-20 13:32:12.86
666	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 50,000,000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-20 13:32:18.332
667	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 20,000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-20 13:32:24.303
682	2	update_project	Direktur memperbarui proyek: Aplikasi Monitoring SPPG (Status: DONE, Nilai: Rp 1.000.000.000)	2026-08-20 13:45:04.408
689	2	login	User Alif Ihsan berhasil login.	2026-08-20 13:56:18.454
690	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 13:58:47.15
1227	8	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 1,700,000 oleh Muhammad Alvin Ababil	2026-08-27 17:00:14.694
1232	4	login	User Muhammad Zaini berhasil login.	2026-08-27 17:04:04.494
1233	8	login	User User Manual berhasil login.	2026-08-27 17:04:09.855
1235	2	login	User Alif Ihsan berhasil login.	2026-08-27 17:05:00.218
1236	2	update_project	Direktur memperbarui proyek: Last Testing (Status: AKTIF, Nilai: Rp 100.000.000)	2026-08-27 17:05:07.396
1239	1	login	User Damar Muharram berhasil login.	2026-08-27 17:08:11.418
1240	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 17:08:47.737
1242	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 17:19:11.752
1253	2	input_rab	Mengatur budget proyek p: Nilai Kontrak Rp 1.000.000, Target Pemasukan Rp 110.000	2026-08-27 17:59:06.075
1254	2	update_project	Direktur memperbarui proyek: p (Status: DONE, Nilai: Rp 1.000.000)	2026-08-27 17:59:41.742
1272	4	login	User Muhammad Zaini berhasil login.	2026-08-28 06:26:51.023
1273	4	alokasi_pos	Project Manager mengalokasikan 5 pos baru pada proyek Proyek Baru	2026-08-28 06:28:24.04
1274	2	login	User Alif Ihsan berhasil login.	2026-08-28 06:28:53.091
1275	4	login	User Muhammad Zaini berhasil login.	2026-08-28 06:29:36.46
1289	4	login	User Muhammad Zaini berhasil login.	2026-08-28 06:36:50.445
1290	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 5,000,000 untuk proyek Proyek Baru	2026-08-28 06:37:17.561
1291	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-28 06:37:37.653
1312	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 84,000 oleh Muhammad Alvin Ababil	2026-08-28 07:52:02.22
668	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 2,000,000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-20 13:32:29.978
669	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 20,000,000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-20 13:32:35.236
670	2	login	User Alif Ihsan berhasil login.	2026-08-20 13:32:40.658
671	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 13:34:23.117
672	3	alokasi_pos	Tim Keuangan mengalokasikan 3 pos baru pada proyek Aplikasi Monitoring SPPG	2026-08-20 13:34:55.767
673	3	realisasi_pemasukan	Tim Keuangan merealisasikan pemasukan Retur Penjualan Jasa "Pengembalian Uang Daisaq" sebesar Rp 25.000.000 pada proyek: Aplikasi Monitoring SPPG	2026-08-20 13:36:22.293
676	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 13:39:17.538
677	2	login	User Alif Ihsan berhasil login.	2026-08-20 13:40:18.656
678	2	update_project	Direktur memperbarui proyek: Aplikasi Monitoring SPPG (Status: DONE, Nilai: Rp 1.000.000.000)	2026-08-20 13:41:49.336
681	2	update_project	Direktur memperbarui proyek: Aplikasi Monitoring SPPG (Status: Active)	2026-08-20 13:44:38.975
685	2	login	User Alif Ihsan berhasil login.	2026-08-20 13:46:43.231
1228	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 17:00:27.597
1230	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 1,700,000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-27 17:00:52.034
1256	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 20:04:56.735
1277	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-28 06:30:07.55
1278	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 50,000 untuk proyek Proyek Baru	2026-08-28 06:32:20.801
1279	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 70,000 untuk proyek Proyek Baru	2026-08-28 06:32:20.806
1280	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-28 06:32:48.32
1281	4	login	User Muhammad Zaini berhasil login.	2026-08-28 06:33:15.008
1313	1	login	User Damar Muharram berhasil login.	2026-08-28 10:02:52.146
674	3	realisasi_pemasukan	Tim Keuangan merealisasikan pemasukan Biaya Penjualan Jasa Lainnya "Penjualan Bakso" sebesar Rp 500.000 pada proyek: Aplikasi Monitoring SPPG	2026-08-20 13:38:34.271
675	2	login	User Alif Ihsan berhasil login.	2026-08-20 13:38:59.034
679	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 13:42:33.281
680	2	login	User Alif Ihsan berhasil login.	2026-08-20 13:43:42.041
683	2	update_project	Direktur memperbarui proyek: Aplikasi Monitoring SPPG (Status: Active)	2026-08-20 13:45:14.706
684	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 13:45:33
686	4	login	User Muhammad Zaini berhasil login.	2026-08-20 13:55:10.606
687	2	login	User Alif Ihsan berhasil login.	2026-08-20 13:55:27.792
688	1	login	User Damar Muharram berhasil login.	2026-08-20 13:55:39.308
691	2	login	User Alif Ihsan berhasil login.	2026-08-20 15:42:05.72
692	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-20 15:43:37.002
693	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 15:47:07.359
694	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-20 15:53:12.235
695	2	login	User Alif Ihsan berhasil login.	2026-08-20 16:16:56.075
696	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 84.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-20 16:20:51.018
697	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 96.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-20 16:20:51.517
698	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 205.268 untuk proyek Aplikasi Monitoring SPPG	2026-08-20 16:20:51.723
699	1	login	User Damar Muharram berhasil login.	2026-08-20 16:23:08.184
700	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-20 17:12:24.344
701	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-21 03:08:30.592
702	4	login	User Muhammad Zaini berhasil login.	2026-08-21 03:13:15.48
703	2	login	User Alif Ihsan berhasil login.	2026-08-21 03:16:03.255
704	2	login	User Alif Ihsan berhasil login.	2026-08-21 03:22:25.376
705	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 03:22:21.806
706	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 03:32:29.505
707	1	login	User Damar Muharram berhasil login.	2026-08-21 03:38:26.334
708	2	login	User Alif Ihsan berhasil login.	2026-08-21 03:44:08.839
709	2	create_proyek	Membuat proyek baru: Aplikasi Netflix dengan nilai Rp 100.000.000	2026-08-21 03:46:25.87
710	4	login	User Muhammad Zaini berhasil login.	2026-08-21 03:47:00.535
711	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 03:49:37.619
712	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 03:52:45.531
713	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 03:54:17.17
714	2	login	User Alif Ihsan berhasil login.	2026-08-21 03:58:07.067
715	2	login	User Alif Ihsan berhasil login.	2026-08-21 03:58:44.019
716	2	update_project	Direktur memperbarui proyek: Aplikasi Netflix (Status: AKTIF, Nilai: Rp 100.000.000)	2026-08-21 04:02:33.978
717	2	update_project	Direktur memperbarui proyek: Aplikasi Monitoring SPPG (Status: DONE, Nilai: Rp 1.000.000.000)	2026-08-21 04:02:40.492
718	2	login	User Alif Ihsan berhasil login.	2026-08-21 04:16:50.377
719	2	login	User Alif Ihsan berhasil login.	2026-08-21 04:19:20.487
720	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 04:19:41.068
721	2	login	User Alif Ihsan berhasil login.	2026-08-21 04:20:24.995
722	2	update_project	Direktur memperbarui proyek: Aplikasi Monitoring SPPG (Status: Active)	2026-08-21 04:20:44.457
723	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 04:20:51.687
724	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 04:24:54.306
725	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 06:13:46.631
726	2	login	User Alif Ihsan berhasil login.	2026-08-21 06:15:18.994
727	4	login	User Muhammad Zaini berhasil login.	2026-08-21 06:15:39.499
728	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 06:17:56.404
729	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 06:18:37.881
730	2	login	User Alif Ihsan berhasil login.	2026-08-21 06:20:02.331
731	4	login	User Muhammad Zaini berhasil login.	2026-08-21 06:31:42.82
732	2	login	User Alif Ihsan berhasil login.	2026-08-21 06:33:50.425
733	4	login	User Muhammad Zaini berhasil login.	2026-08-21 06:36:28.93
734	2	login	User Alif Ihsan berhasil login.	2026-08-21 06:36:33.226
735	4	login	User Muhammad Zaini berhasil login.	2026-08-21 06:37:24.761
736	2	login	User Alif Ihsan berhasil login.	2026-08-21 06:38:32.949
737	2	login	User Alif Ihsan berhasil login.	2026-08-21 06:42:34.49
738	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 06:44:50.796
739	2	login	User Alif Ihsan berhasil login.	2026-08-21 06:47:39.878
740	2	update_project	Direktur memperbarui proyek: Aplikasi Netflix (Status: AKTIF, Nilai: Rp 100.000.000)	2026-08-21 06:51:52.865
741	2	login	User Alif Ihsan berhasil login.	2026-08-21 06:53:40.419
742	2	create_proyek	Membuat proyek baru: Aplikasi X dengan nilai Rp 100.000.000	2026-08-21 06:54:37.343
743	2	login	User Alif Ihsan berhasil login.	2026-08-21 06:55:51.798
744	2	login	User Alif Ihsan berhasil login.	2026-08-21 06:56:18.249
745	2	login	User Alif Ihsan berhasil login.	2026-08-21 06:56:51.963
746	2	create_proyek	Membuat proyek baru: Renovasi jalanan kiaracondong dengan nilai Rp 100.000.000	2026-08-21 07:00:57.566
747	2	input_rab	Mengatur budget proyek Aplikasi Netflix: Nilai Kontrak Rp 100.000.000, RAB Pengeluaran Rp 10.000	2026-08-21 07:04:36.475
748	2	input_rab	Menginput RAB proyek Renovasi jalanan kiaracondong senilai Rp 10.000.000	2026-08-21 07:05:06.798
749	2	alokasi_pemasukan	Mengalokasikan pemasukan proyek Renovasi jalanan kiaracondong senilai Rp 1.000.000	2026-08-21 07:05:19.785
750	2	alokasi_pemasukan	Mengalokasikan pemasukan proyek Renovasi jalanan kiaracondong senilai Rp 2.000.000	2026-08-21 07:05:33.31
751	2	input_rab	Mengatur budget proyek Aplikasi Netflix: Nilai Kontrak Rp 100.000.000, RAB Pengeluaran Rp 110.000	2026-08-21 07:06:55.133
752	2	input_rab	Mengatur budget proyek Aplikasi Netflix: Nilai Kontrak Rp 100.000.000, RAB Pengeluaran Rp 110.000	2026-08-21 07:07:12.506
753	2	input_rab	Mengatur budget proyek Aplikasi Netflix: Nilai Kontrak Rp 100.000.000, RAB Pengeluaran Rp 110.000	2026-08-21 07:08:29.33
754	2	update_project	Direktur memperbarui proyek: Aplikasi Netflix (Status: DONE, Nilai: Rp 100.000.000)	2026-08-21 07:09:21.186
755	2	input_rab	Menginput RAB proyek Aplikasi X senilai Rp 10.000.000	2026-08-21 07:09:54.984
756	2	input_rab	Menginput RAB proyek Aplikasi Netflix senilai Rp 1.110.000	2026-08-21 07:17:26.469
757	2	input_rab	Mengatur budget proyek Aplikasi X: Nilai Kontrak Rp 100.000.000, RAB Pengeluaran Rp 0	2026-08-21 07:19:52
759	2	input_rab	Mengatur budget proyek Aplikasi X: Nilai Kontrak Rp 100.000.000, RAB Pengeluaran Rp 80.000.000	2026-08-21 07:22:12.778
760	2	assign_project_members	Direktur mengatur ulang anggota proyek Aplikasi X (1 orang)	2026-08-21 07:22:25.57
1229	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 5,000,000 oleh User Manual. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-27 17:00:45.823
1238	3	alokasi_pos	Tim Keuangan mengalokasikan 1 pos baru pada proyek Last Testing	2026-08-27 17:05:40.397
1257	2	login	User Alif Ihsan berhasil login.	2026-08-27 22:01:14.782
1282	4	login	User Muhammad Zaini berhasil login.	2026-08-28 06:33:21.968
1284	4	reject_pengajuan	PM menolak pengajuan Reimbursement Rp 50,000 oleh Muhammad Alvin Ababil	2026-08-28 06:33:58.739
1288	2	login	User Alif Ihsan berhasil login.	2026-08-28 06:35:31.752
1292	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 5,000,000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BCA	2026-08-28 06:37:52.889
1293	4	login	User Muhammad Zaini berhasil login.	2026-08-28 06:37:59.781
1294	4	ubah_alokasi	Mengubah alokasi pos (ket #28) proyek Proyek Baru menjadi Rp 2.500.000	2026-08-28 06:39:07.572
1298	4	ubah_alokasi	Mengubah alokasi pos (sub #75) proyek Proyek Baru menjadi Rp 5.000.000	2026-08-28 06:39:53.822
1299	2	login	User Alif Ihsan berhasil login.	2026-08-28 06:40:18.608
1314	2	login	User Alif Ihsan berhasil login.	2026-08-29 09:54:58.886
761	4	login	User Muhammad Zaini berhasil login.	2026-08-21 07:22:38.088
762	2	login	User Alif Ihsan berhasil login.	2026-08-21 07:23:40.686
763	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-21 07:26:11.567
764	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-21 07:26:22.285
765	2	input_rab	Menginput RAB proyek Aplikasi Netflix senilai Rp 1.100.000	2026-08-21 07:31:39.086
766	2	input_rab	Menginput RAB proyek Aplikasi Netflix senilai Rp 2.100.000	2026-08-21 07:31:58.331
767	2	login	User Alif Ihsan berhasil login.	2026-08-21 08:11:09.554
768	1	login	User Damar Muharram berhasil login.	2026-08-23 06:11:33.727
769	4	login	User Muhammad Zaini berhasil login.	2026-08-23 06:52:57.995
770	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-23 08:03:43.084
771	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-23 08:15:41.286
772	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-23 08:57:25.442
773	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-23 09:01:01.275
774	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-23 09:02:05.269
775	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-23 09:24:57.504
776	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-23 09:33:26.208
777	2	login	User Alif Ihsan berhasil login.	2026-08-23 09:37:53.866
778	2	assign_project_members	Direktur mengatur ulang anggota proyek Aplikasi Netflix (2 orang)	2026-08-23 09:38:47.384
779	2	update_project	Direktur memperbarui proyek: Aplikasi Netflix (Status: Active)	2026-08-23 09:38:52.624
780	4	login	User Muhammad Zaini berhasil login.	2026-08-23 09:39:15.761
781	4	login	User Muhammad Zaini berhasil login.	2026-08-23 09:41:12.233
782	4	login	User Muhammad Zaini berhasil login.	2026-08-23 09:41:40.769
783	4	login	User Muhammad Zaini berhasil login.	2026-08-23 09:43:46.996
784	4	login	User Muhammad Zaini berhasil login.	2026-08-23 09:47:30.734
785	4	alokasi_pos	Project Manager mengalokasikan 2 pos baru pada proyek Aplikasi Netflix	2026-08-23 09:51:02.527
786	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-23 09:51:10.477
787	2	login	User Alif Ihsan berhasil login.	2026-08-24 01:18:34.095
788	2	login	User Alif Ihsan berhasil login.	2026-08-24 01:24:11.476
789	2	login	User Alif Ihsan berhasil login.	2026-08-24 01:32:46.493
790	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-24 01:34:29.696
791	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 84.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-24 01:35:54.195
792	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 26.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-24 01:35:54.603
793	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 205.268 untuk proyek Aplikasi Monitoring SPPG	2026-08-24 01:35:54.606
794	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-24 06:11:33.635
795	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-24 06:30:24.657
796	1	login	User Damar Muharram berhasil login.	2026-08-24 06:30:42.386
797	1	submit_pengajuan	Superadmin mengajukan Realisasi Anggaran Rp 10.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-24 06:44:39.632
798	4	login	User Muhammad Zaini berhasil login.	2026-08-24 06:52:36.241
799	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-24 07:21:19.492
800	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-24 08:37:50.818
801	1	submit_pengajuan	Superadmin mengajukan Realisasi Anggaran Rp 15.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-24 09:03:38.496
802	1	reject_keuangan	Superadmin menolak pengajuan Realisasi Anggaran Rp 15.000 oleh Damar Muharram	2026-08-24 09:13:36.665
803	1	approve_keuangan	Superadmin mencairkan Realisasi Anggaran Rp 10.000 oleh Damar Muharram. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-24 09:13:57.32
804	1	submit_pengajuan	Superadmin mengajukan Realisasi Anggaran Rp 20.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-24 09:14:36.851
805	2	login	User Alif Ihsan berhasil login.	2026-08-24 11:45:09.41
806	2	login	User Alif Ihsan berhasil login.	2026-08-24 12:19:21.605
807	2	login	User Alif Ihsan berhasil login.	2026-08-24 12:19:44.031
808	2	login	User Alif Ihsan berhasil login.	2026-08-24 12:32:04.633
809	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-24 12:34:44.889
810	1	login	User Damar Muharram berhasil login.	2026-08-24 12:34:58.997
811	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-24 12:46:54.553
812	4	login	User Muhammad Zaini berhasil login.	2026-08-24 13:20:32.248
813	4	login	User Muhammad Zaini berhasil login.	2026-08-24 13:24:27.822
814	4	ubah_alokasi	Mengubah alokasi pos (sub #33) proyek Aplikasi Monitoring SPPG menjadi Rp 190.000.000	2026-08-24 13:26:24.459
815	4	ubah_alokasi	Mengubah alokasi pos (sub #33) proyek Aplikasi Monitoring SPPG menjadi Rp 180.000.000	2026-08-24 13:26:40.88
816	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-24 14:53:03.763
817	2	login	User Alif Ihsan berhasil login.	2026-08-24 14:54:00.274
818	2	input_rab	Mengatur budget proyek Aplikasi Monitoring SPPG: Nilai Kontrak Rp 1.000.000.000, RAB Pengeluaran Rp 600.000.000	2026-08-24 14:58:46.365
819	2	input_rab	Mengatur budget proyek Aplikasi Monitoring SPPG: Nilai Kontrak Rp 1.000.000.000, RAB Pengeluaran Rp 700.000.000	2026-08-24 14:58:57.316
820	2	input_rab	Mengatur budget proyek Aplikasi Monitoring SPPG: Nilai Kontrak Rp 1.000.000.000, RAB Pengeluaran Rp 700.000.000	2026-08-24 15:00:07.186
821	2	input_rab	Mengatur budget proyek Aplikasi Monitoring SPPG: Nilai Kontrak Rp 1.000.000.000, RAB Pengeluaran Rp 700.000.000	2026-08-24 15:00:20.802
822	2	update_project	Direktur memperbarui proyek: Aplikasi Netflix (Status: DONE, Nilai: Rp 100.000.000)	2026-08-24 15:09:55.608
823	2	update_project	Direktur memperbarui proyek: Aplikasi Netflix (Status: AKTIF, Nilai: Rp 100.000.000)	2026-08-24 15:10:16.836
824	2	login	User Alif Ihsan berhasil login.	2026-08-24 15:19:58.259
825	2	create_proyek	Membuat proyek baru: Test Refactor dengan nilai Rp 1.000.000.000.000	2026-08-24 15:23:27.977
826	2	login	User Alif Ihsan berhasil login.	2026-08-24 16:10:04.048
827	2	input_rab	Mengatur budget proyek Test Refactor: Nilai Kontrak Rp 1.000.000.000.000, RAB Pengeluaran Rp 300.000.000.000	2026-08-24 16:12:02.016
828	2	input_rab	Mengatur budget proyek Test Refactor: Nilai Kontrak Rp 1.000.000.000.000, RAB Pengeluaran Rp 0	2026-08-24 16:15:43.606
829	2	create_proyek	Membuat proyek baru: Test Refactor dengan nilai Rp 1.000.000.000.000	2026-08-24 16:16:38.199
830	2	input_rab	Mengatur budget proyek Test Refactor: Nilai Kontrak Rp 1.000.000.000.000, RAB Pengeluaran Rp 300.000.000.000	2026-08-24 16:25:21.496
831	2	input_rab	Mengatur budget proyek Test Refactor: Nilai Kontrak Rp 1.000.000.000.000, RAB Pengeluaran Rp 300.000.000.000	2026-08-24 16:25:40.352
832	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-24 16:34:13.246
833	2	create_proyek	Membuat proyek baru: Test Refactor	2026-08-24 16:58:24.327
834	2	create_proyek	Membuat proyek baru: Test Refactor	2026-08-24 17:00:47.953
835	2	create_proyek	Membuat proyek baru: Testing Refactor dengan nilai Rp 1.000.000.000.000	2026-08-24 17:09:32.362
836	2	login	User Alif Ihsan berhasil login.	2026-08-25 03:40:41.499
837	2	login	User Alif Ihsan berhasil login.	2026-08-25 03:44:35.197
838	2	update_project	Direktur memperbarui proyek: Testing Refactor (Status: PLANNING, Nilai: Rp 1.000.000.000)	2026-08-25 03:46:46.81
839	2	update_project	Direktur memperbarui proyek: Testing Refactor (Status: PLANNING, Nilai: Rp 1.000.000.000.000)	2026-08-25 03:48:44.098
840	2	assign_project_members	Direktur mengatur ulang anggota proyek Testing Refactor (1 orang)	2026-08-25 03:50:32.43
841	2	assign_project_members	Direktur mengatur ulang anggota proyek Testing Refactor (2 orang)	2026-08-25 03:50:43.729
842	2	input_rab	Mengatur budget proyek Testing Refactor: Nilai Kontrak Rp 1.000.000.000.000, Target Pemasukan Rp 200.000.000.000	2026-08-25 03:54:29.401
843	2	input_rab	Mengatur budget proyek Testing Refactor: Nilai Kontrak Rp 1.000.000.000.000, Target Pemasukan Rp 200.000.000.000	2026-08-25 03:55:18.447
844	2	input_rab	Mengatur budget proyek Testing Refactor: Nilai Kontrak Rp 1.000.000.000.000, Target Pemasukan Rp 200.000.000.000	2026-08-25 03:55:47.656
845	4	login	User Muhammad Zaini berhasil login.	2026-08-25 03:56:00.473
846	2	review_pengajuan_anggaran	Direktur menyetujui pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" (Biaya Produksi Proyek) untuk proyek Testing Refactor.	2026-08-25 03:59:41.567
847	4	alokasi_pos	Project Manager mengalokasikan 9 pos baru pada proyek Testing Refactor	2026-08-25 04:02:09.324
848	4	ubah_alokasi	Mengubah alokasi pos (ket #20) proyek Testing Refactor menjadi Rp 40.000.000.000	2026-08-25 04:02:28.43
849	4	ubah_alokasi	Mengubah alokasi pos (sub #47) proyek Testing Refactor menjadi Rp 80.000.000.000	2026-08-25 04:02:43.023
850	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 100.000.000 untuk proyek Testing Refactor	2026-08-25 04:03:59.904
851	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-25 04:04:39.012
852	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 1.000.000 untuk proyek Testing Refactor	2026-08-25 04:06:26.546
853	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 1.000.000 untuk proyek Testing Refactor	2026-08-25 04:07:14.766
854	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-25 04:07:22.692
855	2	update_project	Direktur memperbarui proyek: Testing Refactor (Status: AKTIF, Nilai: Rp 1.000.000.000.000)	2026-08-25 04:08:41.655
856	3	alokasi_pos	Tim Keuangan mengalokasikan 1 pos baru pada proyek Testing Refactor	2026-08-25 04:09:07.601
857	3	alokasi_pos	Tim Keuangan mengalokasikan 2 pos baru pada proyek Testing Refactor	2026-08-25 04:09:29.304
858	4	login	User Muhammad Zaini berhasil login.	2026-08-25 04:11:05.033
859	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 1.000.000 oleh Muhammad Alvin Ababil	2026-08-25 04:11:50.736
860	4	reject_pengajuan	PM menolak pengajuan Reimbursement Rp 1.000.000 oleh Muhammad Alvin Ababil	2026-08-25 04:12:19.825
861	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-25 04:13:22.755
862	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 100.000.000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-25 04:14:25.124
863	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 1.000.000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-25 04:14:35.663
864	3	reject_keuangan	Tim Keuangan menolak pengajuan Realisasi Anggaran Rp 20.000 oleh Damar Muharram	2026-08-25 04:14:42.784
865	1	login	User Damar Muharram berhasil login.	2026-08-25 05:58:41.665
866	2	login	User Alif Ihsan berhasil login.	2026-08-25 06:33:07.233
867	1	ubah_alokasi	Mengubah alokasi pos (main #53) proyek Testing Refactor menjadi Rp 200.000.000.000	2026-08-25 06:34:54.831
868	1	ubah_alokasi	Mengubah alokasi pos (sub #45) proyek Testing Refactor menjadi Rp 40.000.000.000	2026-08-25 06:35:13.101
869	1	alokasi_pos	Super Admin mengalokasikan 2 pos baru pada proyek Testing Refactor	2026-08-25 06:35:50.167
870	1	approve_pengajuan	SUPER ADMIN menyetujui pengajuan Reimbursement Rp 205.268 oleh Muhammad Alvin Ababil	2026-08-25 06:36:21.815
871	1	approve_pengajuan	SUPER ADMIN menyetujui pengajuan Reimbursement Rp 205.268 oleh Muhammad Alvin Ababil	2026-08-25 06:37:25.728
872	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-25 06:41:22.919
873	2	login	User Alif Ihsan berhasil login.	2026-08-25 06:43:02.877
874	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-25 07:45:06.934
875	4	login	User Muhammad Zaini berhasil login.	2026-08-25 07:53:13.498
876	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-25 08:10:47.859
877	4	login	User Muhammad Zaini berhasil login.	2026-08-25 08:12:11.039
878	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-25 08:12:28.457
879	2	login	User Alif Ihsan berhasil login.	2026-08-25 08:17:41.786
880	1	login	User Damar Muharram berhasil login.	2026-08-25 08:24:45.107
881	4	login	User Muhammad Zaini berhasil login.	2026-08-25 09:04:44.91
882	2	login	User Alif Ihsan berhasil login.	2026-08-25 09:05:55.412
883	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-25 09:51:49.166
884	2	login	User Alif Ihsan berhasil login.	2026-08-25 09:55:12.595
885	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-25 10:03:44.654
886	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-25 10:48:35.141
887	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 875.000 untuk proyek Testing Refactor	2026-08-25 11:15:18.882
888	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 65.000 untuk proyek Testing Refactor	2026-08-25 11:15:18.945
889	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 43.500 untuk proyek Testing Refactor	2026-08-25 11:15:19.089
890	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 681.600 untuk proyek Testing Refactor	2026-08-25 11:15:19.098
891	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 681.600 untuk proyek Testing Refactor	2026-08-25 11:45:56.05
892	5	cancel_pengajuan	Membatalkan pengajuan Reimbursement Rp 681.600 untuk proyek Testing Refactor	2026-08-25 11:57:21.62
893	5	cancel_pengajuan	Membatalkan pengajuan Reimbursement Rp 65.000 untuk proyek Testing Refactor	2026-08-25 12:04:48.327
894	4	login	User Muhammad Zaini berhasil login.	2026-08-25 12:21:38.465
895	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 10.000.000 untuk proyek Testing Refactor	2026-08-25 12:21:58.905
896	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-25 12:22:22.149
897	2	login	User Alif Ihsan berhasil login.	2026-08-25 12:42:01.674
898	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-25 12:45:37.501
899	4	login	User Muhammad Zaini berhasil login.	2026-08-25 12:48:43.186
900	2	login	User Alif Ihsan berhasil login.	2026-08-25 12:55:45.094
901	4	login	User Muhammad Zaini berhasil login.	2026-08-25 13:17:16.494
902	2	login	User Alif Ihsan berhasil login.	2026-08-25 13:21:05.674
903	2	input_rab	Mengatur budget proyek Testing Refactor: Nilai Kontrak Rp 1.000.000.000.000, Target Pemasukan Rp 200.000.000.000	2026-08-25 13:21:48.219
904	2	update_project	Direktur memperbarui proyek: Aplikasi Netflix (Status: DONE, Nilai: Rp 100.000.000)	2026-08-25 13:25:05.142
905	1	login	User Damar Muharram berhasil login.	2026-08-25 13:32:51.15
906	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-25 13:35:51.999
907	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 875.000 oleh Muhammad Alvin Ababil	2026-08-25 13:42:07.553
908	4	reject_pengajuan	PM menolak pengajuan Reimbursement Rp 43.500 oleh Muhammad Alvin Ababil	2026-08-25 13:42:20.472
909	4	ubah_alokasi	Mengubah alokasi pos (ket #23) proyek Testing Refactor menjadi Rp 5.000.000.000	2026-08-25 13:43:17.049
910	4	alokasi_pos	Project Manager mengalokasikan 2 pos baru pada proyek Testing Refactor	2026-08-25 13:46:32.214
911	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 100.000 untuk proyek Testing Refactor	2026-08-25 13:46:55.013
912	2	login	User Alif Ihsan berhasil login.	2026-08-25 13:48:43.307
913	2	update_project	Direktur memperbarui proyek: Testing Refactor (Status: AKTIF, Nilai: Rp 1.000.000.000.000)	2026-08-25 13:54:22.557
914	4	login	User Muhammad Zaini berhasil login.	2026-08-25 13:56:57.535
915	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 1,000,000,000 untuk proyek Testing Refactor	2026-08-25 14:18:27.89
916	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-25 14:24:35.4
917	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 1,000,000,000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-25 14:25:12.547
918	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-25 14:25:58.378
919	2	login	User Alif Ihsan berhasil login.	2026-08-25 14:30:51.778
920	4	login	User Muhammad Zaini berhasil login.	2026-08-25 15:56:14.257
921	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-25 15:56:53.318
922	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 875.000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-25 16:30:18.917
923	4	login	User Muhammad Zaini berhasil login.	2026-08-25 16:34:18.297
924	4	login	User Muhammad Zaini berhasil login.	2026-08-25 16:35:19.929
925	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 02:56:19.144
926	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 03:30:11.967
927	1	login	User Damar Muharram berhasil login.	2026-08-26 03:37:25.15
928	4	login	User Muhammad Zaini berhasil login.	2026-08-26 03:56:16.732
929	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 10.000.000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-26 04:32:12.708
930	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 205.268 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-26 04:35:20.959
931	3	approve_keuangan	Tim Keuangan mencairkan Realisasi Anggaran Rp 100.000 oleh Muhammad Zaini. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-26 04:35:44.646
932	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-26 04:44:02.231
933	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 05:09:59.212
934	1	login	User Damar Muharram berhasil login.	2026-08-26 05:10:12.127
935	2	login	User Alif Ihsan berhasil login.	2026-08-26 05:10:35.584
936	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-26 05:12:12.18
937	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-26 05:13:31.379
938	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 05:46:15.128
939	1	login	User Damar Muharram berhasil login.	2026-08-26 11:55:37.556
940	4	login	User Muhammad Zaini berhasil login.	2026-08-26 12:43:21.135
941	4	login	User Muhammad Zaini berhasil login.	2026-08-26 12:50:37.776
942	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 13:32:13.224
943	1	login	User Damar Muharram berhasil login.	2026-08-26 14:05:04.647
944	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-26 14:18:04.608
945	4	login	User Muhammad Zaini berhasil login.	2026-08-26 14:19:01.634
946	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 26.000 oleh Muhammad Alvin Ababil	2026-08-26 14:19:41.822
947	2	login	User Alif Ihsan berhasil login.	2026-08-26 14:22:45.329
948	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-26 14:23:31.247
949	1	login	User Damar Muharram berhasil login.	2026-08-26 14:23:39.954
950	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 26.000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-26 14:27:30.172
951	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 205.268 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-26 14:29:58.727
952	1	approve_pengajuan	SUPER ADMIN menyetujui pengajuan Reimbursement Rp 84.000 oleh Muhammad Alvin Ababil	2026-08-26 14:40:28.55
953	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 84.000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank Mandiri	2026-08-26 14:41:07.09
954	1	approve_pengajuan	SUPER ADMIN menyetujui pengajuan Reimbursement Rp 681.600 oleh Muhammad Alvin Ababil	2026-08-26 14:42:31.66
955	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 681.600 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-26 14:42:55.225
956	4	login	User Muhammad Zaini berhasil login.	2026-08-26 14:44:34.326
957	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 14:44:45.553
958	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-26 14:47:31.523
959	2	login	User Alif Ihsan berhasil login.	2026-08-26 14:50:27.352
960	2	login	User Alif Ihsan berhasil login.	2026-08-26 14:57:13.198
961	2	login	User Alif Ihsan berhasil login.	2026-08-26 15:04:44.912
962	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 15:16:30.753
963	4	login	User Muhammad Zaini berhasil login.	2026-08-26 15:18:04.31
964	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-26 15:18:28.848
965	2	login	User Alif Ihsan berhasil login.	2026-08-26 15:38:50.346
966	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-26 15:41:32.427
967	4	login	User Muhammad Zaini berhasil login.	2026-08-26 15:48:54.57
968	2	login	User Alif Ihsan berhasil login.	2026-08-26 16:01:46.205
969	4	login	User Muhammad Zaini berhasil login.	2026-08-26 16:09:37.416
970	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 16:13:08.041
971	4	login	User Muhammad Zaini berhasil login.	2026-08-26 16:14:23.252
972	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 96.000 oleh Muhammad Alvin Ababil	2026-08-26 16:15:24.541
973	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 16:15:44.376
974	2	create_proyek	Membuat proyek baru: test 1 dengan nilai Rp 1.000.000.000	2026-08-26 16:16:58.418
975	2	login	User Alif Ihsan berhasil login.	2026-08-26 16:17:19.384
976	1	alokasi_pos	Super Admin mengalokasikan 1 pos baru pada proyek Renovasi jalanan kiaracondong	2026-08-26 16:22:43.165
977	1	approve_keuangan	Superadmin mencairkan Reimbursement Rp 96.000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-26 16:23:04.941
978	1	approve_pengajuan	SUPER ADMIN menyetujui pengajuan Reimbursement Rp 84.000 oleh Muhammad Alvin Ababil	2026-08-26 16:23:16.162
979	1	submit_pengajuan	Superadmin mengajukan Realisasi Anggaran Rp 10.000.000 untuk proyek Testing Refactor	2026-08-26 16:24:06.743
980	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 16:27:13.446
981	1	review_pengajuan_anggaran	Superadmin menyetujui pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" (Biaya Produksi Proyek) untuk proyek Testing Refactor.	2026-08-26 16:31:50.707
982	1	input_rab	Mengatur budget proyek Testing Refactor: Nilai Kontrak Rp 1.000.000.000.000, Target Pemasukan Rp 200.000.000.000	2026-08-26 16:32:09.69
983	1	input_rab	Mengatur budget proyek Testing Refactor: Nilai Kontrak Rp 1.000.000.000.000, Target Pemasukan Rp 300.000.000.000	2026-08-26 16:32:33.008
984	1	update_project	Super Admin memperbarui proyek: Testing Refactor (Status: AKTIF, Nilai: Rp 1.000.000.000.000)	2026-08-26 16:33:02.607
985	1	login	User Damar Muharram berhasil login.	2026-08-26 16:34:24.786
986	1	login	User Damar Muharram berhasil login.	2026-08-26 16:35:15.049
987	2	login	User Alif Ihsan berhasil login.	2026-08-26 16:39:18.826
988	2	create_proyek	Membuat proyek baru: Testing Refactor 2 dengan nilai Rp 100.000.000.000	2026-08-26 16:40:56.377
989	4	login	User Muhammad Zaini berhasil login.	2026-08-26 16:44:28.255
990	2	create_proyek	Membuat proyek baru: Testing Refactor 2 dengan nilai Rp 100.000.000	2026-08-26 16:46:11.624
991	4	login	User Muhammad Zaini berhasil login.	2026-08-26 16:49:48.633
992	2	login	User Alif Ihsan berhasil login.	2026-08-26 16:51:35.635
993	2	login	User Alif Ihsan berhasil login.	2026-08-26 16:56:31.646
994	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-26 17:04:00.597
995	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 17:04:44.159
996	1	login	User Damar Muharram berhasil login.	2026-08-26 17:19:38.475
997	2	login	User Alif Ihsan berhasil login.	2026-08-26 17:27:29.81
998	4	login	User Muhammad Zaini berhasil login.	2026-08-26 17:33:12.779
999	2	login	User Alif Ihsan berhasil login.	2026-08-26 17:52:54.07
1000	1	update_project	Super Admin memperbarui proyek: Aplikasi Monitoring SPPG (Status: AKTIF)	2026-08-26 17:55:15.93
1001	1	update_project	Super Admin memperbarui proyek: Aplikasi Monitoring SPPG (Status: AKTIF)	2026-08-26 17:55:39.801
1002	1	submit_pengajuan	Superadmin mengajukan Realisasi Anggaran Rp 875.000 untuk proyek Testing Refactor	2026-08-26 17:56:39.366
1003	1	submit_pengajuan	Superadmin mengajukan Realisasi Anggaran Rp 65.000 untuk proyek Testing Refactor	2026-08-26 17:56:39.384
1004	1	submit_pengajuan	Superadmin mengajukan Realisasi Anggaran Rp 43.500 untuk proyek Testing Refactor	2026-08-26 17:57:56.454
1005	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-26 17:58:28.722
1006	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 43.500 untuk proyek Testing Refactor	2026-08-26 17:58:55.61
1007	1	login	User Damar Muharram berhasil login.	2026-08-26 18:05:08.426
1008	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 18:10:00.966
1009	1	register_member	Super Admin mendaftarkan anggota baru: damar hassan (Karyawan)	2026-08-26 18:14:18.584
1010	2	login	User Alif Ihsan berhasil login.	2026-08-26 18:21:14.193
1011	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-26 18:25:15.572
1012	2	login	User Alif Ihsan berhasil login.	2026-08-26 18:26:31.424
1013	1	login	User Damar Muharram berhasil login.	2026-08-27 00:03:06.066
1014	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 00:52:29.047
1015	4	login	User Muhammad Zaini berhasil login.	2026-08-27 01:00:09.175
1016	2	login	User Alif Ihsan berhasil login.	2026-08-27 01:15:45.811
1017	2	login	User Alif Ihsan berhasil login.	2026-08-27 01:24:26.418
1018	1	login	User Damar Muharram berhasil login.	2026-08-27 02:46:04.968
1019	1	login	User Damar Muharram berhasil login.	2026-08-27 02:55:32.569
1020	1	login	User Damar Muharram berhasil login.	2026-08-27 04:43:15.138
1021	4	login	User Muhammad Zaini berhasil login.	2026-08-27 04:45:04.461
1022	2	login	User Alif Ihsan berhasil login.	2026-08-27 04:46:10.874
1023	1	login	User Damar Muharram berhasil login.	2026-08-27 04:46:35.776
1024	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 04:47:45.856
1025	2	login	User Alif Ihsan berhasil login.	2026-08-27 04:50:21.032
1026	2	login	User Alif Ihsan berhasil login.	2026-08-27 04:50:49.878
1027	2	input_rab	Mengatur budget proyek Testing Refactor 2: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 20.000.000	2026-08-27 04:52:13.614
1028	2	input_rab	Mengatur budget proyek Testing Refactor 2: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 20.000.000	2026-08-27 05:00:38.752
1029	1	login	User Damar Muharram berhasil login.	2026-08-27 05:03:29.36
1030	2	login	User Alif Ihsan berhasil login.	2026-08-27 05:03:51.292
1031	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 05:06:02.584
1032	1	login	User Damar Muharram berhasil login.	2026-08-27 05:08:11.567
1033	2	login	User Alif Ihsan berhasil login.	2026-08-27 05:09:03.081
1034	2	login	User Alif Ihsan berhasil login.	2026-08-27 05:11:20.662
1035	1	login	User Damar Muharram berhasil login.	2026-08-27 05:12:13.375
1036	2	login	User Alif Ihsan berhasil login.	2026-08-27 05:12:38.464
1037	1	login	User Damar Muharram berhasil login.	2026-08-27 05:12:49.668
1038	1	create_master_data	Super Admin - Menambahkan Master Main baru (aset): Kas Perusahaan	2026-08-27 05:15:45.2
1039	1	create_master_data	Super Admin - Menambahkan Master Sub baru (aset): Iuran Karyawan	2026-08-27 05:16:46.226
1040	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 31)	2026-08-27 05:17:48.494
1041	2	input_rab	Mengatur budget proyek Testing Refactor 2: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 20.000.000	2026-08-27 05:17:58.591
1042	1	login	User Damar Muharram berhasil login.	2026-08-27 05:18:29.147
1070	2	login	User Alif Ihsan berhasil login.	2026-08-27 05:26:04.384
1071	2	input_rab	Mengatur budget proyek UAT Direktur: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 0	2026-08-27 05:26:24.03
1086	4	login	User Muhammad Zaini berhasil login.	2026-08-27 05:35:17.435
1237	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 17:05:12.251
1258	2	create_proyek	Membuat proyek baru: Proyek Baru dengan nilai Rp 100.000.000	2026-08-27 22:41:24.288
1286	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 70,000 oleh Muhammad Alvin Ababil. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BJB	2026-08-28 06:34:52.089
1295	4	ubah_alokasi	Mengubah alokasi pos (ket #29) proyek Proyek Baru menjadi Rp 7.500.000	2026-08-28 06:39:18.958
1296	4	ubah_alokasi	Mengubah alokasi pos (sub #75) proyek Proyek Baru menjadi Rp 10.000.000	2026-08-28 06:39:34.827
1297	4	ubah_alokasi	Mengubah alokasi pos (sub #76) proyek Proyek Baru menjadi Rp 20.000.000	2026-08-28 06:39:40.538
1043	4	login	User Muhammad Zaini berhasil login.	2026-08-27 05:18:38.929
1044	1	login	User Damar Muharram berhasil login.	2026-08-27 05:18:44.789
1046	1	create_master_data	Super Admin - Menambahkan Master Sub baru (aset): Iuran Karyawan	2026-08-27 05:19:16.251
1047	1	delete_master_data	Super Admin - Menghapus Master Sub (ID: 66)	2026-08-27 05:19:37.14
1048	1	update_master_data	Super Admin - Mengubah Master Main (ID: 32) menjadi: Kas	2026-08-27 05:19:45.12
1050	1	assign_project_members	Superadmin mengatur ulang anggota proyek test 1 (1 orang)	2026-08-27 05:20:01.013
1054	4	login	User Muhammad Zaini berhasil login.	2026-08-27 05:20:41.676
1055	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 05:20:50.695
1056	1	register_member	Super Admin mendaftarkan anggota baru: UAT Nomor Satu (Karyawan)	2026-08-27 05:21:04.595
1063	1	login	User Damar Muharram berhasil login.	2026-08-27 05:23:23.686
1064	1	input_rab	Mengatur budget proyek Testing Refactor: Nilai Kontrak Rp 1.000.000.000.000, Target Pemasukan Rp 300.000.000.000	2026-08-27 05:23:30.275
1065	1	update_member	Super Admin memperbarui data anggota: UAT Nomor Satu (Karyawan)	2026-08-27 05:23:56.456
1074	4	ubah_alokasi	Mengubah alokasi pos (sub #45) proyek Testing Refactor menjadi Rp 120.000.000.000	2026-08-27 05:27:12.476
1079	1	update_project	Super Admin memperbarui proyek: UAT Superadmin (Status: AKTIF, Nilai: Rp 100.000.000)	2026-08-27 05:30:06.799
1080	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 05:32:26.798
1081	1	input_rab	Mengatur budget proyek UAT Superadmin: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 50.000.000	2026-08-27 05:32:49.537
1082	1	input_rab	Mengatur budget proyek UAT Superadmin: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 50.000.000	2026-08-27 05:32:58.965
1083	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 05:33:19.187
1084	1	input_rab	Mengatur budget proyek UAT Superadmin: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 50.000.000	2026-08-27 05:34:26.909
1085	1	input_rab	Mengatur budget proyek UAT Superadmin: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 50.000.000	2026-08-27 05:34:33.199
1087	2	login	User Alif Ihsan berhasil login.	2026-08-27 05:36:24.894
1244	2	create_proyek	Membuat proyek baru: Testing Aja dengan nilai Rp 100.000	2026-08-27 17:19:47.538
1259	1	login	User Damar Muharram berhasil login.	2026-08-28 03:31:52.043
1301	1	login	User Damar Muharram berhasil login.	2026-08-28 06:43:04.433
1045	1	create_master_data	Super Admin - Menambahkan Master Main baru (aset): Kas Perusahaan 	2026-08-27 05:18:58.305
1245	2	create_proyek	Membuat proyek baru: Cobain dengan nilai Rp 10.000.000	2026-08-27 17:28:08.979
1249	2	login	User Alif Ihsan berhasil login.	2026-08-27 17:33:20.059
1260	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-28 04:10:53.558
1302	1	login	User Damar Muharram berhasil login.	2026-08-28 06:46:01.495
1303	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-28 06:48:29.387
1049	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 05:19:59.775
1051	2	login	User Alif Ihsan berhasil login.	2026-08-27 05:20:11.889
1052	1	update_master_data	Super Admin - Mengubah Master Sub (ID: 47) menjadi: Bank BCA	2026-08-27 05:20:24.569
1053	2	assign_project_members	Direktur mengatur ulang anggota proyek test 1 (1 orang)	2026-08-27 05:20:27.977
1057	7	login	User UAT Nomor Satu berhasil login.	2026-08-27 05:22:12.089
1058	4	alokasi_pos	Project Manager mengalokasikan 1 pos baru pada proyek Aplikasi Monitoring SPPG	2026-08-27 05:22:14.367
1059	1	login	User Damar Muharram berhasil login.	2026-08-27 05:22:24.462
1060	1	create_proyek	Membuat proyek baru: UAT Superadmin dengan nilai Rp 100.000.000	2026-08-27 05:22:28.863
1061	2	login	User Alif Ihsan berhasil login.	2026-08-27 05:22:40.148
1062	2	create_proyek	Membuat proyek baru: UAT Direktur dengan nilai Rp 100.000.000	2026-08-27 05:23:02.306
1066	4	login	User Muhammad Zaini berhasil login.	2026-08-27 05:24:33.039
1067	1	input_rab	Mengatur budget proyek UAT Superadmin: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 0	2026-08-27 05:24:57.04
1068	1	input_rab	Mengatur budget proyek UAT Superadmin: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 0	2026-08-27 05:25:18.552
1069	1	input_rab	Mengatur budget proyek UAT Superadmin: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 50.000.000	2026-08-27 05:25:28.952
1072	2	input_rab	Mengatur budget proyek UAT Direktur: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 50.000.000	2026-08-27 05:26:33.196
1073	2	input_rab	Mengatur budget proyek UAT Direktur: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 40.000.000	2026-08-27 05:27:07.608
1075	4	ubah_alokasi	Mengubah alokasi pos (sub #45) proyek Testing Refactor menjadi Rp 48.000.000.000	2026-08-27 05:27:56.801
1076	2	update_project	Direktur memperbarui proyek: UAT Direktur (Status: AKTIF, Nilai: Rp 100.000.000)	2026-08-27 05:28:07.643
1077	1	login	User Damar Muharram berhasil login.	2026-08-27 05:29:47.911
1078	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 05:29:55.947
1088	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 05:37:01.45
1089	7	login	User UAT Nomor Satu berhasil login.	2026-08-27 05:37:47.159
1090	3	alokasi_pos	Tim Keuangan mengalokasikan 3 pos baru pada proyek UAT Superadmin	2026-08-27 05:39:20.254
1091	1	input_rab	Mengatur budget proyek UAT Superadmin: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 50.000.000	2026-08-27 05:39:43.041
1092	4	login	User Muhammad Zaini berhasil login.	2026-08-27 05:40:10.307
1093	2	login	User Alif Ihsan berhasil login.	2026-08-27 05:40:25.382
1094	2	assign_project_members	Direktur mengatur ulang anggota proyek test 1 (2 orang)	2026-08-27 05:41:00.462
1095	4	login	User Muhammad Zaini berhasil login.	2026-08-27 05:41:31.394
1096	2	login	User Alif Ihsan berhasil login.	2026-08-27 05:42:22.542
1097	7	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 43.500 untuk proyek Aplikasi Monitoring SPPG	2026-08-27 05:42:58.792
1098	2	review_pengajuan_anggaran	Direktur menyetujui pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" (Biaya Produksi Proyek) untuk proyek Testing Refactor.	2026-08-27 05:43:08.165
1099	1	input_rab	Mengatur budget proyek UAT Superadmin: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 50.000.000	2026-08-27 05:43:10.62
1100	1	login	User Damar Muharram berhasil login.	2026-08-27 05:43:19.164
1101	4	login	User Muhammad Zaini berhasil login.	2026-08-27 05:43:53.363
1102	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 43.500 oleh UAT Nomor Satu	2026-08-27 05:44:21.001
1103	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 05:44:43.816
1104	3	approve_keuangan	Tim Keuangan mencairkan Reimbursement Rp 43.500 oleh UAT Nomor Satu. Jurnal Debit: , Kredit: MAIN · Bank > SUB · Bank BCA	2026-08-27 05:45:26.089
1105	4	login	User Muhammad Zaini berhasil login.	2026-08-27 05:48:18.809
1106	1	update_project	Super Admin memperbarui proyek: UAT Superadmin (Status: AKTIF, Nilai: Rp 100.000.000)	2026-08-27 05:51:57.737
1107	4	login	User Muhammad Zaini berhasil login.	2026-08-27 05:52:15.114
1108	4	login	User Muhammad Zaini berhasil login.	2026-08-27 05:53:10.585
1109	4	login	User Muhammad Zaini berhasil login.	2026-08-27 07:09:13.303
1110	2	login	User Alif Ihsan berhasil login.	2026-08-27 07:13:50.555
1111	1	login	User Damar Muharram berhasil login.	2026-08-27 07:17:24.456
1112	4	login	User Muhammad Zaini berhasil login.	2026-08-27 07:18:40.299
1113	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 07:36:05.867
1114	1	login	User Damar Muharram berhasil login.	2026-08-27 07:40:04.704
1115	1	login	User Damar Muharram berhasil login.	2026-08-27 07:46:07.777
1116	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 09:32:59.334
1117	4	login	User Muhammad Zaini berhasil login.	2026-08-27 10:16:44.971
1118	4	login	User Muhammad Zaini berhasil login.	2026-08-27 10:25:37.152
1119	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 84.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-27 10:29:31.323
1120	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 26.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-27 10:29:31.499
1121	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 273.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-27 10:29:32.217
1122	4	login	User Muhammad Zaini berhasil login.	2026-08-27 11:16:44.47
1123	4	reject_pengajuan	PM menolak pengajuan Reimbursement Rp 84.000 oleh Muhammad Alvin Ababil	2026-08-27 11:17:43.524
1124	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 11:17:50.339
1125	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 84.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-27 11:24:43.103
1126	2	login	User Alif Ihsan berhasil login.	2026-08-27 11:26:23.543
1127	2	review_pengajuan_anggaran	Direktur menyetujui pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" (Biaya Produksi Proyek) untuk proyek Testing Refactor.	2026-08-27 11:27:11.54
1128	2	review_pengajuan_anggaran	Direktur menyetujui pengajuan "Perubahan alokasi anggaran: Biaya Administrasi Proyek" (Biaya Administrasi Proyek) untuk proyek Testing Refactor.	2026-08-27 11:27:12.115
1129	7	login	User UAT Nomor Satu berhasil login.	2026-08-27 11:27:34.857
1130	7	login	User UAT Nomor Satu berhasil login.	2026-08-27 11:27:43.94
1131	4	login	User Muhammad Zaini berhasil login.	2026-08-27 11:28:29.87
1132	1	login	User Damar Muharram berhasil login.	2026-08-27 11:36:15.344
1133	5	submit_pengajuan	Karyawan mengajukan Reimbursement Rp 84.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-27 11:52:36.826
1134	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 11:53:59.464
1135	3	alokasi_pos	Tim Keuangan mengalokasikan 1 pos baru pada proyek Aplikasi Monitoring SPPG	2026-08-27 12:00:10.843
1205	2	login	User Alif Ihsan berhasil login.	2026-08-27 16:24:02.086
1136	3	realisasi_pemasukan	Tim Keuangan merealisasikan pemasukan Penjualan Jasa "Gramedia" sebesar Rp 1.000.000 pada proyek: Aplikasi Monitoring SPPG	2026-08-27 12:01:14.956
1137	3	alokasi_pos	Tim Keuangan mengalokasikan 1 pos baru pada proyek Aplikasi Monitoring SPPG	2026-08-27 12:02:39.375
1138	3	realisasi_pemasukan	Tim Keuangan merealisasikan pemasukan Penjualan Jasa "Gramedia 2" sebesar Rp 1.000.000 pada proyek: Aplikasi Monitoring SPPG	2026-08-27 12:02:55.373
1139	1	realisasi_pemasukan	Superadmin merealisasikan pemasukan Penjualan Jasa "SUperadmin Gramedia" sebesar Rp 1.000.000 pada proyek: Aplikasi Monitoring SPPG	2026-08-27 12:07:02.699
1140	4	login	User Muhammad Zaini berhasil login.	2026-08-27 12:07:37.981
1141	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 12:19:33.212
1142	4	login	User Muhammad Zaini berhasil login.	2026-08-27 12:20:01.493
1143	4	login	User Muhammad Zaini berhasil login.	2026-08-27 12:20:04.154
1144	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 12:21:11.41
1145	4	login	User Muhammad Zaini berhasil login.	2026-08-27 12:26:47.957
1146	2	login	User Alif Ihsan berhasil login.	2026-08-27 12:27:07.046
1147	1	login	User Damar Muharram berhasil login.	2026-08-27 12:30:08.002
1148	4	login	User Muhammad Zaini berhasil login.	2026-08-27 12:40:37.352
1149	2	login	User Alif Ihsan berhasil login.	2026-08-27 12:40:48.865
1150	1	login	User Damar Muharram berhasil login.	2026-08-27 12:41:57.918
1151	1	input_rab	Mengatur budget proyek UAT Direktur: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 40.000.000	2026-08-27 12:45:46.871
1152	2	login	User Alif Ihsan berhasil login.	2026-08-27 13:04:21.196
1153	1	input_rab	Mengatur budget proyek Testing Refactor: Nilai Kontrak Rp 1.000.000.000.000, Target Pemasukan Rp 200.000.000.000	2026-08-27 13:07:21.481
1154	1	input_rab	Mengatur budget proyek Testing Refactor: Nilai Kontrak Rp 1.000.000.000.000, Target Pemasukan Rp 200.000.000.000	2026-08-27 13:07:29.826
1155	1	input_rab	Mengatur budget proyek Aplikasi X: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 30.000.000	2026-08-27 13:08:48.663
1156	2	input_rab	Mengatur budget proyek Testing Refactor: Nilai Kontrak Rp 1.000.000.000.000, Target Pemasukan Rp 200.000.000.000	2026-08-27 13:09:03.206
1157	2	login	User Alif Ihsan berhasil login.	2026-08-27 13:29:26.593
1158	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 13:36:02.905
1159	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 13:39:36.149
1160	4	login	User Muhammad Zaini berhasil login.	2026-08-27 13:40:44.158
1161	4	ubah_alokasi	Mengubah alokasi pos (ket #12) proyek Aplikasi Monitoring SPPG menjadi Rp 60.000.000	2026-08-27 13:48:59.6
1162	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 13:51:42.295
1163	1	login	User Damar Muharram berhasil login.	2026-08-27 13:57:03.888
1164	2	login	User Alif Ihsan berhasil login.	2026-08-27 13:58:19.78
1165	2	review_pengajuan_anggaran	Direktur menolak pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" (Biaya Produksi Proyek) untuk proyek Aplikasi Monitoring SPPG.	2026-08-27 13:58:43.399
1166	4	login	User Muhammad Zaini berhasil login.	2026-08-27 13:58:54.413
1167	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 14:05:33.692
1168	2	login	User Alif Ihsan berhasil login.	2026-08-27 14:07:49.158
1169	4	ubah_alokasi	Mengubah alokasi pos (ket #12) proyek Aplikasi Monitoring SPPG menjadi Rp 50.000.000	2026-08-27 14:08:52.118
1170	4	ubah_alokasi	Mengubah alokasi pos (ket #12) proyek Aplikasi Monitoring SPPG menjadi Rp 60.000.000	2026-08-27 14:11:31.45
1171	1	login	User Damar Muharram berhasil login.	2026-08-27 14:19:00.033
1172	2	login	User Alif Ihsan berhasil login.	2026-08-27 14:19:15.487
1173	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 14:32:09.342
1174	4	alokasi_pos	Project Manager mengalokasikan 2 pos baru pada proyek Aplikasi Monitoring SPPG	2026-08-27 14:35:43.514
1175	4	login	User Muhammad Zaini berhasil login.	2026-08-27 14:38:20.148
1176	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 14:45:55.849
1177	4	submit_pengajuan	Project Manager mengajukan Realisasi Anggaran Rp 30.000.000 untuk proyek Aplikasi Monitoring SPPG	2026-08-27 14:59:35.957
1178	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 15:12:36.048
1179	4	approve_pengajuan	PM menyetujui pengajuan Reimbursement Rp 84.000 oleh Muhammad Alvin Ababil	2026-08-27 15:17:18.779
1180	2	login	User Alif Ihsan berhasil login.	2026-08-27 15:19:59.439
1181	2	create_proyek	Membuat proyek baru: Last Testing dengan nilai Rp 100.000.000	2026-08-27 15:20:38.02
1182	4	reject_pengajuan	PM menolak pengajuan Reimbursement Rp 84.000 oleh Muhammad Alvin Ababil	2026-08-27 15:20:40.098
1183	2	update_project	Direktur memperbarui proyek: Last Testing (Status: PLANNING, Nilai: Rp 100.000.000)	2026-08-27 15:21:16.702
1184	2	update_project	Direktur memperbarui proyek: Last Testing (Status: PLANNING, Nilai: Rp 100.000.000)	2026-08-27 15:21:25.496
1185	2	update_project	Direktur memperbarui proyek: Last Testing (Status: PLANNING, Nilai: Rp 100.000.000)	2026-08-27 15:21:38.313
1186	2	update_project	Direktur memperbarui proyek: Last Testing (Status: PLANNING, Nilai: Rp 100.000.000)	2026-08-27 15:21:48.464
1187	1	login	User Damar Muharram berhasil login.	2026-08-27 15:25:24.238
1188	1	register_member	Super Admin mendaftarkan anggota baru: User Manual (Project Manager)	2026-08-27 15:44:58.228
1189	1	login	User Damar Muharram berhasil login.	2026-08-27 15:48:53.326
1190	4	login	User Muhammad Zaini berhasil login.	2026-08-27 15:53:53.867
1191	4	login	User Muhammad Zaini berhasil login.	2026-08-27 15:53:59.343
1192	2	login	User Alif Ihsan berhasil login.	2026-08-27 15:54:03.194
1193	1	login	User Damar Muharram berhasil login.	2026-08-27 15:54:15.173
1194	2	input_rab	Mengatur budget proyek Last Testing: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 30.000.000	2026-08-27 15:57:57.3
1195	2	input_rab	Mengatur budget proyek Last Testing: Nilai Kontrak Rp 100.000.000, Target Pemasukan Rp 30.000.000	2026-08-27 15:58:39.797
1196	1	create_master_data	Super Admin - Menambahkan Master Main baru (pengeluaran): Tes Nama Baru	2026-08-27 16:01:18.191
1197	1	update_master_data	Super Admin - Mengubah Master Main (ID: 33) menjadi: Tes Edit Nama Baru	2026-08-27 16:04:02.355
1198	1	delete_master_data	Super Admin - Menghapus Master Main (ID: 33)	2026-08-27 16:05:49.172
1199	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 16:07:26.322
1200	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 16:12:26.946
1201	4	login	User Muhammad Zaini berhasil login.	2026-08-27 16:17:25.915
1202	2	login	User Alif Ihsan berhasil login.	2026-08-27 16:19:46.296
1203	2	assign_project_members	Direktur mengatur ulang anggota proyek Last Testing (2 orang)	2026-08-27 16:20:22.119
1204	1	login	User Damar Muharram berhasil login.	2026-08-27 16:22:09.021
1206	1	login	User Damar Muharram berhasil login.	2026-08-27 16:26:32.897
1207	1	login	User Damar Muharram berhasil login.	2026-08-27 16:29:20.176
1208	4	login	User Muhammad Zaini berhasil login.	2026-08-27 16:29:41.845
1209	1	login	User Damar Muharram berhasil login.	2026-08-27 16:29:48.445
1210	8	login	User User Manual berhasil login.	2026-08-27 16:30:04.24
1211	8	alokasi_pos	Project Manager mengalokasikan 4 pos baru pada proyek Last Testing	2026-08-27 16:31:15.594
1212	3	login	User Ghanif Hadiyana Akbar berhasil login.	2026-08-27 16:31:32.925
1213	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-27 16:32:35.024
1215	8	ubah_alokasi	Mengubah alokasi pos (sub #68) proyek Last Testing menjadi Rp 10.000.000	2026-08-27 16:39:36.533
1218	2	login	User Alif Ihsan berhasil login.	2026-08-27 16:50:20.859
1246	2	update_project	Direktur memperbarui proyek: Cobain (Status: DONE, Nilai: Rp 10.000.000)	2026-08-27 17:31:37.482
1261	1	login	User Damar Muharram berhasil login.	2026-08-28 04:15:47.272
1304	1	login	User Damar Muharram berhasil login.	2026-08-28 07:16:29.02
1214	2	login	User Alif Ihsan berhasil login.	2026-08-27 16:32:56.291
1216	2	login	User Alif Ihsan berhasil login.	2026-08-27 16:46:00.158
1217	4	login	User Muhammad Zaini berhasil login.	2026-08-27 16:47:04.315
1247	2	input_rab	Mengatur budget proyek Testing Aja: Nilai Kontrak Rp 100.000, Target Pemasukan Rp 10.000	2026-08-27 17:32:05.522
1262	5	login	User Muhammad Alvin Ababil berhasil login.	2026-08-28 04:16:16.144
1305	1	login	User Damar Muharram berhasil login.	2026-08-28 07:17:15.249
\.


--
-- Data for Name: budget; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budget (id, proyek_id, total_pengeluaran, total_reimbursement, sisa_budget, pemasukan_belum_dialokasikan, total_pemasukan, nilai_kontrak, target_pemasukan) FROM stdin;
16	21	117690036.00	117690036.00	582309964.00	0.00	885980000.00	1000000000.00	300000000.00
18	23	0.00	0.00	100000000.00	0.00	0.00	100000000.00	30000000.00
17	22	0.00	0.00	100000000.00	0.00	100000000.00	100000000.00	10000000.00
26	35	0.00	0.00	100000000.00	0.00	100000000.00	100000000.00	50000000.00
19	24	0.00	0.00	10000000.00	0.00	0.00	100000000.00	2000000.00
25	34	0.00	0.00	100000000.00	0.00	70000000.00	100000000.00	20000000.00
27	36	0.00	0.00	100000000.00	0.00	100000000.00	100000000.00	40000000.00
33	42	0.00	0.00	100000000.00	0.00	0.00	100000000.00	0.00
32	41	5070000.00	5070000.00	94930000.00	0.00	50000000.00	100000000.00	30000000.00
\.


--
-- Data for Name: jurnal_akuntansi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jurnal_akuntansi (id, reimbursement_id, no_akun_kredit, no_akun_debit, nominal, keterangan, transaksi_pemasukan_id) FROM stdin;
26	40	MAIN · Bank > SUB · Bank BJB	MAIN · Biaya Produksi Proyek > SUB · Biaya Pengadaan Barang dan Jasa > KET · Makanan	7000000.00	Pencairan Reimbursement 40 - Muhammad Alvin Ababil untuk Makanan	\N
27	39	MAIN · Bank > SUB · Bank Mandiri	MAIN · Biaya Produksi Proyek > SUB · Biaya Pengadaan Barang dan Jasa > KET · Alat Elektronik	38000000.00	Pencairan Reimbursement 39 - Muhammad Alvin Ababil untuk Alat Elektronik	\N
28	38	MAIN · Bank > SUB · Bank Mandiri	MAIN · Biaya Produksi Proyek > SUB · Biaya Personil > KET · Gaji Pemotong Bawang	50000000.00	Pencairan Realisasi Anggaran 38 - Muhammad Zaini untuk Gaji Pemotong Bawang	\N
29	37	MAIN · Bank > SUB · Bank Mandiri	MAIN · Biaya Produksi Proyek > SUB · Biaya Personil > KET · Gaji Supir	20000.00	Pencairan Realisasi Anggaran 37 - Muhammad Zaini untuk Gaji Supir	\N
30	36	MAIN · Bank > SUB · Bank Mandiri	MAIN · Biaya Produksi Proyek > SUB · Biaya Personil > KET · Gaji Programmer	2000000.00	Pencairan Realisasi Anggaran 36 - Muhammad Zaini untuk Gaji Programmer	\N
31	35	MAIN · Bank > SUB · Bank Mandiri	MAIN · Biaya Produksi Proyek > SUB · Biaya Personil > KET · Gaji Programmer	20000000.00	Pencairan Realisasi Anggaran 35 - Muhammad Zaini untuk Gaji Programmer	\N
32	\N	1.2 - Piutang Usaha	4.2 - Retur Penjualan	25000000.00	Pencatatan Retur Penjualan Jasa: Pengembalian Uang Daisaq	6
33	\N	4.0 - Pendapatan Penjualan	1.1 - Kas & Bank	500000.00	Pencatatan Biaya Penjualan Jasa Lainnya: Penjualan Bakso	7
36	\N	4.0 - Pendapatan Penjualan	1.1 - Kas & Bank	882980000.00	Pencatatan Realisasi Pendapatan Penjualan Proyek: Aplikasi Monitoring SPPG	8
38	47	MAIN · Bank > SUB · Bank Mandiri	MAIN · Biaya Produksi Proyek > SUB · Biaya Pengadaan Barang dan Jasa > KET · Makanan	10000.00	Pencairan Realisasi Anggaran 47 - Damar Muharram untuk Makanan	\N
42	\N	4.0 - Pendapatan Penjualan	1.1 - Kas & Bank	100000000.00	Pencatatan Realisasi Pendapatan Penjualan Proyek: Aplikasi Netflix	9
46	43	MAIN · Bank > SUB · Bank BJB	MAIN · Biaya Produksi Proyek > SUB · Biaya Pengadaan Barang dan Jasa > KET · Alat Elektronik	205268.00	Pencairan Reimbursement 43 - Muhammad Alvin Ababil untuk Alat Elektronik	\N
48	46	MAIN · Bank > SUB · Bank Mandiri	MAIN · Biaya Produksi Proyek > SUB · Biaya Pengadaan Barang dan Jasa > KET · Alat Elektronik	26000.00	Pencairan Reimbursement 46 - Muhammad Alvin Ababil untuk Alat Elektronik	\N
49	45	MAIN · Bank > SUB · Bank BJB	MAIN · Biaya Produksi Proyek > SUB · Biaya Pengadaan Barang dan Jasa > KET · Alat Elektronik	205268.00	Pencairan Reimbursement 45 - Muhammad Alvin Ababil untuk Alat Elektronik	\N
50	44	MAIN · Bank > SUB · Bank Mandiri	MAIN · Biaya Produksi Proyek > SUB · Biaya Pengadaan Barang dan Jasa > KET · Alat Elektronik	84000.00	Pencairan Reimbursement 44 - Muhammad Alvin Ababil untuk Alat Elektronik	\N
52	42	MAIN · Bank > SUB · Bank BJB	MAIN · Biaya Produksi Proyek > SUB · Biaya Pengadaan Barang dan Jasa > KET · Alat Elektronik	96000.00	Pencairan Reimbursement 42 - Muhammad Alvin Ababil untuk Alat Elektronik	\N
53	66	MAIN · Bank > SUB · Bank BCA	MAIN · Biaya Produksi Proyek > SUB · Biaya Personil > KET · Gaji Programmer	43500.00	Pencairan Reimbursement 66 - UAT Nomor Satu untuk Gaji Programmer	\N
54	\N	4.0 - Pendapatan Penjualan	1.1 - Kas & Bank	1000000.00	Pencatatan Penjualan Jasa: Gramedia	11
55	\N	4.0 - Pendapatan Penjualan	1.1 - Kas & Bank	1000000.00	Pencatatan Penjualan Jasa: Gramedia 2	12
56	\N	4.0 - Pendapatan Penjualan	1.1 - Kas & Bank	1000000.00	Pencatatan Penjualan Jasa: SUperadmin Gramedia	13
62	\N	4.0 - Pendapatan Penjualan	1.1 - Kas & Bank	100000000.00	Pencatatan Realisasi Pendapatan Penjualan Proyek: UAT Direktur	20
63	78	MAIN · Bank > SUB · Bank BJB	MAIN · Biaya Produksi Proyek > SUB · Biaya Personil > KET · Gaji A	70000.00	Pencairan Reimbursement 78 - Muhammad Alvin Ababil untuk Gaji A	\N
64	79	MAIN · Bank > SUB · Bank BCA	MAIN · Biaya Produksi Proyek > SUB · Biaya Personil > KET · Gaji B	5000000.00	Pencairan Realisasi Anggaran 79 - Muhammad Zaini untuk Gaji B	\N
\.


--
-- Data for Name: keterangan_anggaran; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.keterangan_anggaran (id, sub_anggaran_id, keterangan, nominal_alokasi, nominal_realisasi) FROM stdin;
15	34	Alat Elektronik	100000000.00	38616536.00
12	33	Gaji Programmer	60000000.00	22043500.00
25	66	Sewa Peralatan	5000000.00	0.00
28	76	Gaji A	2500000.00	70000.00
29	76	Gaji B	7500000.00	5000000.00
14	33	Gaji Pemotong Bawang	7000000.00	50000000.00
13	33	Gaji Supir	100000000.00	20000.00
17	40	Testing 1	500000.00	0.00
16	34	Makanan	50000000.00	7010000.00
\.


--
-- Data for Name: main_anggaran; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_anggaran (id, budget_id, nama_main, nominal_alokasi, nominal_terpakai, tipe) FROM stdin;
56	25	Penjualan Jasa	20000000.00	0.00	pemasukan
57	25	Biaya Produksi Proyek	30000000.00	0.00	pengeluaran
58	25	Biaya Administrasi Proyek	20000000.00	0.00	pengeluaran
60	25	Biaya Marketing Proyek	30000000.00	0.00	pengeluaran
36	19	Biaya Marketing Proyek	10000000.00	0.00	pengeluaran
37	19	Penjualan Jasa	2000000.00	0.00	pemasukan
65	27	Biaya Marketing Proyek	30000000.00	0.00	pengeluaran
43	18	Biaya Marketing Proyek	50000000.00	0.00	pengeluaran
44	18	Biaya Administrasi Proyek	20000000.00	0.00	pengeluaran
38	17	Biaya Administrasi Proyek	100000.00	0.00	pengeluaran
41	17	Biaya Produksi Proyek	1000000.00	0.00	pengeluaran
46	17	Biaya Marketing Proyek	1000000.00	0.00	pengeluaran
68	26	Penjualan Barang	50000000.00	0.00	pemasukan
61	26	Biaya Marketing Proyek	20000000.00	0.00	pengeluaran
67	26	Biaya Administrasi Proyek	10000000.00	0.00	pengeluaran
30	16	Biaya Marketing Proyek	100000000.00	0.00	pengeluaran
31	16	Biaya Administrasi Proyek	200000000.00	0.00	pengeluaran
32	16	Biaya Produksi Proyek	400000000.00	0.00	pengeluaran
48	16	Penjualan Jasa	300000000.00	3000000.00	pemasukan
42	18	Penjualan Jasa	30000000.00	0.00	pemasukan
69	27	Penjualan Barang	40000000.00	100000000.00	pemasukan
76	32	Penjualan Jasa	30000000.00	0.00	pemasukan
77	32	Biaya Marketing Proyek	20000000.00	0.00	pengeluaran
78	32	Biaya Administrasi Proyek	20000000.00	0.00	pengeluaran
79	32	Biaya Produksi Proyek	25000000.00	0.00	pengeluaran
\.


--
-- Data for Name: master_main; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_main (id, nama, tipe) FROM stdin;
10	Biaya Administrasi Proyek	pengeluaran
13	Penjualan Barang	pemasukan
11	Biaya Produksi Proyek	pengeluaran
9	Biaya Marketing Proyek	pengeluaran
12	Penjualan Jasa	pemasukan
24	Cash	aset
25	Bank	aset
32	Kas	aset
\.


--
-- Data for Name: master_sub; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_sub (id, main_id, nama, tipe) FROM stdin;
47	25	Bank BCA	aset
34	12	Penjualan Jasa	pemasukan
35	12	Diskon Penjualan Jasa	pemasukan
36	12	Retur Penjualan Jasa	pemasukan
37	12	Biaya Penjualan Jasa Lainnya	pemasukan
38	13	Penjualan Barang	pemasukan
39	13	Diskon Penjualan Barang	pemasukan
40	13	Retur Penjualan Barang	pemasukan
41	13	Biaya Penjualan Barang Lainnya	pemasukan
27	10	Biaya Jaminan Proyek	pengeluaran
28	10	Pembuatan Dokumen Kontrak	pengeluaran
29	10	Biaya Administrasi Proyek Lainnya	pengeluaran
25	9	Biaya Marketing Proyek	pengeluaran
33	11	Biaya Garansi	pengeluaran
31	11	Biaya Non Personil	pengeluaran
32	11	Biaya Pengadaan Barang dan Jasa	pengeluaran
26	9	Biaya Marketing Proyek Lainnya	pengeluaran
30	11	Biaya Personil	pengeluaran
46	25	Bank BJB	aset
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, tipe, pesan, dibaca, "timestamp") FROM stdin;
93	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 875.000 menunggu validasi Anda.	t	2026-08-18 08:51:31.122
149	2	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	t	2026-08-25 03:59:00.114
154	5	status_update	Pengajuan Reimbursement Anda senilai Rp 1.000.000 telah disetujui oleh PM.	t	2026-08-25 04:11:50.832
45	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Marketing Proyek" perlu direview	t	2026-08-11 07:42:43.983
19	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	t	2026-08-10 13:27:40.897
21	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Administrasi Proyek" perlu direview	t	2026-08-10 13:28:27.332
39	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Marketing Proyek" perlu direview	t	2026-08-11 07:23:53.664
114	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 380,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-20 11:27:09.56
99	5	status_update	Pengajuan Reimbursement Anda senilai Rp 26.000 telah disetujui oleh PM.	t	2026-08-19 07:45:47.55
156	5	status_update	Pengajuan Reimbursement Anda senilai Rp 1.000.000 telah ditolak oleh PM.	t	2026-08-25 04:12:19.919
158	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 1.000.000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-25 04:14:35.758
162	5	status_update	Pengajuan Reimbursement Anda senilai Rp 205.268 telah disetujui oleh SUPER ADMIN.	t	2026-08-25 06:37:25.827
172	5	status_update	Pengajuan Reimbursement Anda senilai Rp 875.000 telah disetujui oleh PM.	f	2026-08-25 13:42:07.658
176	2	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Administrasi Proyek" perlu direview	f	2026-08-25 13:43:04.245
150	4	PENGAJUAN_DISETUJUI	Pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" untuk proyek Testing Refactor telah disetujui oleh Direktur. Alokasi Biaya Produksi Proyek diperbarui.	t	2026-08-25 03:59:41.467
117	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 500,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-20 11:27:30.728
125	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 38,000,000 menunggu validasi Anda.	t	2026-08-20 13:30:22.684
126	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 7,000,000 menunggu validasi Anda.	t	2026-08-20 13:30:56.563
134	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 20,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-20 13:32:24.41
140	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 84.000 menunggu validasi Anda.	t	2026-08-24 01:35:54.385
100	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 8) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-19 07:45:47.75
106	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Aplikasi Netflix) menunggu pencairan Keuangan.	t	2026-08-20 10:54:52.008
107	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Aplikasi Netflix) menunggu pencairan Keuangan.	t	2026-08-20 10:55:41.703
122	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Aplikasi Monitoring SPPG) menunggu pencairan Keuangan.	t	2026-08-20 13:29:05.903
123	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Aplikasi Monitoring SPPG) menunggu pencairan Keuangan.	t	2026-08-20 13:29:21.306
144	3	approval_request	Pengajuan Realisasi baru dari Superadmin Damar Muharram (Proyek: Aplikasi Monitoring SPPG) menunggu pencairan Keuangan.	t	2026-08-24 09:03:38.803
155	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Testing Refactor) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-25 04:11:51.027
8	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Zaini) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-10 12:29:24.559
10	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Zaini) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-10 12:29:31.791
16	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Zaini) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-10 12:43:57.094
27	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 7) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-11 05:34:55.967
31	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 7) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-11 05:58:20.711
35	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 7) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-11 07:21:07.366
36	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Minggu 7) menunggu pencairan Keuangan.	t	2026-08-11 07:21:32.004
148	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	t	2026-08-25 03:59:00.114
175	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Administrasi Proyek" perlu direview	t	2026-08-25 13:43:04.245
26	5	status_update	Pengajuan Reimbursement Anda senilai Rp 70,000 telah disetujui oleh PM.	t	2026-08-11 05:34:55.54
28	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 70,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-11 05:54:40.53
30	5	status_update	Pengajuan Reimbursement Anda senilai Rp 43,500 telah disetujui oleh PM.	t	2026-08-11 05:58:20.523
165	2	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	t	2026-08-25 09:05:25.652
174	5	status_update	Pengajuan Reimbursement Anda senilai Rp 43.500 telah ditolak oleh PM.	f	2026-08-25 13:42:20.566
168	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 43.500 menunggu validasi Anda.	t	2026-08-25 11:15:19.296
169	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 681.600 menunggu validasi Anda.	t	2026-08-25 11:15:19.301
157	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 100.000.000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-25 04:14:25.221
170	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 681.600 menunggu validasi Anda.	t	2026-08-25 11:45:56.248
78	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 7) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-13 09:10:46.962
111	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Aplikasi Netflix) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-20 11:00:37.212
119	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: b) menunggu pencairan Keuangan.	t	2026-08-20 13:05:10.975
130	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Aplikasi Monitoring SPPG) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-20 13:31:24.812
147	3	approval_request	Pengajuan Realisasi baru dari Superadmin Damar Muharram (Proyek: Aplikasi Monitoring SPPG) menunggu pencairan Keuangan.	t	2026-08-24 09:14:37.139
151	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Testing Refactor) menunggu pencairan Keuangan.	t	2026-08-25 04:04:00.197
94	5	status_update	Pengajuan Reimbursement Anda senilai Rp 875.000 telah ditolak oleh PM.	t	2026-08-18 08:52:31.547
74	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 7) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-12 13:48:46.033
145	1	rejected	Pengajuan Realisasi Anggaran Anda senilai Rp 15.000 ditolak oleh Superadmin. Alasan: Diamlah Bodo	t	2026-08-24 09:13:36.761
146	1	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 10.000 telah DICAIRKAN oleh Superadmin.	t	2026-08-24 09:13:57.415
159	1	rejected	Pengajuan Realisasi Anggaran Anda senilai Rp 20.000 ditolak oleh Tim Keuangan. Alasan: nuh uh	t	2026-08-25 04:14:42.881
164	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	t	2026-08-25 09:05:25.652
76	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 96.000 menunggu validasi Anda.	t	2026-08-13 09:08:24.014
80	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 681.600 menunggu validasi Anda.	t	2026-08-13 09:23:26.532
51	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 7) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-11 09:25:35.976
53	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 7) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-11 09:25:42.636
55	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 7) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-11 09:25:48.035
59	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 7) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-11 09:26:30.201
62	3	alert	PERINGATAN BUDGET: Sisa budget proyek Minggu 7 telah mencapai batas/kurang dari 50% (Sisa: Rp -1.992.918.175)	t	2026-08-11 14:22:19.891
64	3	alert	PERINGATAN BUDGET: Sisa budget proyek Minggu 7 telah mencapai batas/kurang dari 25% (Sisa: Rp -1.992.918.175)	t	2026-08-11 14:22:20.399
66	3	alert	PERINGATAN BUDGET: Sisa budget proyek Minggu 7 telah mencapai batas/kurang dari 10% (Sisa: Rp -1.992.918.175)	t	2026-08-11 14:22:20.894
68	3	alert	PERINGATAN BUDGET: Sisa budget proyek Minggu 7 telah mencapai batas/kurang dari 5% (Sisa: Rp -1.992.918.175)	t	2026-08-11 14:22:21.389
70	3	alert	PERINGATAN BUDGET: Sisa budget proyek Minggu 7 telah mencapai batas/kurang dari 0% (Sisa: Rp -1.992.918.175)	t	2026-08-11 14:22:21.889
81	5	status_update	Pengajuan Reimbursement Anda senilai Rp 681.600 telah disetujui oleh PM.	t	2026-08-13 09:33:27.267
79	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 96.000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-13 09:11:38.011
52	5	status_update	Pengajuan Reimbursement Anda senilai Rp 681.600 telah disetujui oleh PM.	t	2026-08-11 09:25:42.443
132	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 38,000,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-20 13:32:13.05
129	5	status_update	Pengajuan Reimbursement Anda senilai Rp 38,000,000 telah disetujui oleh PM.	t	2026-08-20 13:31:24.558
115	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 50,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-20 11:27:18.31
110	5	status_update	Pengajuan Reimbursement Anda senilai Rp 380,000 telah disetujui oleh PM.	t	2026-08-20 11:00:36.925
160	5	status_update	Pengajuan Reimbursement Anda senilai Rp 205.268 telah disetujui oleh SUPER ADMIN.	t	2026-08-25 06:36:21.914
85	2	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	t	2026-08-17 12:57:12.175
98	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 681.600 menunggu validasi Anda.	t	2026-08-18 11:54:06.104
91	5	status_update	Pengajuan Reimbursement Anda senilai Rp 43,500 telah disetujui oleh PM.	t	2026-08-17 14:42:11.039
89	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 1,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-17 13:48:08.792
87	5	status_update	Pengajuan Reimbursement Anda senilai Rp 1,000 telah disetujui oleh PM.	t	2026-08-17 13:47:30.162
83	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 681.600 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-13 09:37:27.942
32	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 43,500 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-11 06:03:59.342
34	5	status_update	Pengajuan Reimbursement Anda senilai Rp 450.000 telah disetujui oleh PM.	t	2026-08-11 07:21:07.173
38	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 450.000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-11 07:22:08.489
50	5	status_update	Pengajuan Reimbursement Anda senilai Rp 2.000.000.000 telah disetujui oleh PM.	t	2026-08-11 09:25:35.785
54	5	status_update	Pengajuan Reimbursement Anda senilai Rp 191.475 telah disetujui oleh PM.	t	2026-08-11 09:25:47.847
56	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 681.600 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-11 09:26:00.575
57	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 191.475 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-11 09:26:06.229
58	5	status_update	Pengajuan Reimbursement Anda senilai Rp 681.600 telah disetujui oleh PM.	t	2026-08-11 09:26:30.008
60	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 681.600 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-11 09:26:40.094
71	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 2.000.000.000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-11 14:22:23.409
73	5	status_update	Pengajuan Reimbursement Anda senilai Rp 681.600.000 telah disetujui oleh PM.	t	2026-08-12 13:48:45.833
75	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 681.600.000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-12 13:49:18.576
77	5	status_update	Pengajuan Reimbursement Anda senilai Rp 96.000 telah disetujui oleh PM.	t	2026-08-13 09:10:46.692
86	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 1,000 menunggu validasi Anda.	t	2026-08-17 13:47:15.273
90	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 43,500 menunggu validasi Anda.	t	2026-08-17 14:41:58.958
97	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 26.000 menunggu validasi Anda.	t	2026-08-18 11:54:03.87
95	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 84.000 menunggu validasi Anda.	t	2026-08-18 11:53:56.405
96	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 205.268 menunggu validasi Anda.	t	2026-08-18 11:54:00.416
84	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	t	2026-08-17 12:57:12.175
108	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 50,000 menunggu validasi Anda.	t	2026-08-20 10:59:37.127
131	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 7,000,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-20 13:32:05.973
127	5	status_update	Pengajuan Reimbursement Anda senilai Rp 7,000,000 telah disetujui oleh PM.	t	2026-08-20 13:31:19.774
112	5	status_update	Pengajuan Reimbursement Anda senilai Rp 50,000 telah disetujui oleh PM.	t	2026-08-20 11:00:45.595
101	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 84.000 menunggu validasi Anda.	t	2026-08-19 13:32:31.755
82	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 7) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-13 09:33:27.485
88	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 8) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-17 13:47:30.508
92	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Minggu 8) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-17 14:42:11.24
105	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Aplikasi Netflix) menunggu pencairan Keuangan.	t	2026-08-20 10:54:20.184
113	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Aplikasi Netflix) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-20 11:00:45.806
121	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Aplikasi Monitoring SPPG) menunggu pencairan Keuangan.	t	2026-08-20 13:28:52.274
124	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Aplikasi Monitoring SPPG) menunggu pencairan Keuangan.	t	2026-08-20 13:29:44.985
102	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 205.268 menunggu validasi Anda.	t	2026-08-19 13:32:40.157
103	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 96.000 menunggu validasi Anda.	t	2026-08-19 13:32:54.173
104	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 681.600 menunggu validasi Anda.	t	2026-08-19 13:32:58.377
109	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 380,000 menunggu validasi Anda.	t	2026-08-20 11:00:15.64
118	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 500,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-20 11:27:51.446
120	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 600,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-20 13:05:33.106
133	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 50,000,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-20 13:32:18.454
137	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 84.000 menunggu validasi Anda.	t	2026-08-20 16:20:51.215
141	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 26.000 menunggu validasi Anda.	t	2026-08-24 01:35:54.79
142	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 205.268 menunggu validasi Anda.	t	2026-08-24 01:35:54.796
152	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 1.000.000 menunggu validasi Anda.	t	2026-08-25 04:06:26.742
153	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 1.000.000 menunggu validasi Anda.	t	2026-08-25 04:07:14.957
166	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 875.000 menunggu validasi Anda.	t	2026-08-25 11:15:19.08
167	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 65.000 menunggu validasi Anda.	t	2026-08-25 11:15:19.146
116	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 500,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-20 11:27:24.819
135	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 2,000,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-20 13:32:30.102
136	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 20,000,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-20 13:32:35.34
138	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 96.000 menunggu validasi Anda.	t	2026-08-20 16:20:51.749
139	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 205.268 menunggu validasi Anda.	t	2026-08-20 16:20:51.936
179	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 1,000,000,000 telah DICAIRKAN oleh Tim Keuangan.	t	2026-08-25 14:25:12.644
180	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 875.000 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-25 16:30:19.019
128	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Aplikasi Monitoring SPPG) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-20 13:31:19.97
143	3	approval_request	Pengajuan Realisasi baru dari Superadmin Damar Muharram (Proyek: Aplikasi Monitoring SPPG) menunggu pencairan Keuangan.	t	2026-08-24 06:44:39.93
161	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Aplikasi Monitoring SPPG) disetujui SUPER ADMIN, menunggu pencairan Keuangan.	t	2026-08-25 06:36:22.109
163	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Aplikasi Monitoring SPPG) disetujui SUPER ADMIN, menunggu pencairan Keuangan.	t	2026-08-25 06:37:26.022
171	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Testing Refactor) menunggu pencairan Keuangan.	t	2026-08-25 12:21:59.238
173	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Testing Refactor) disetujui PM, menunggu pencairan Keuangan.	t	2026-08-25 13:42:07.868
177	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Testing Refactor) menunggu pencairan Keuangan.	t	2026-08-25 13:46:55.303
178	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Testing Refactor) menunggu pencairan Keuangan.	t	2026-08-25 14:18:28.188
181	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 10.000.000 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-26 04:32:12.808
182	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 205.268 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-26 04:35:21.055
183	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 100.000 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-26 04:35:44.744
184	5	status_update	Pengajuan Reimbursement Anda senilai Rp 26.000 telah disetujui oleh PM.	f	2026-08-26 14:19:41.928
185	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Aplikasi Monitoring SPPG) disetujui PM, menunggu pencairan Keuangan.	f	2026-08-26 14:19:42.123
186	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 26.000 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-26 14:27:30.271
187	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 205.268 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-26 14:29:58.823
188	5	status_update	Pengajuan Reimbursement Anda senilai Rp 84.000 telah disetujui oleh SUPER ADMIN.	f	2026-08-26 14:40:28.646
189	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Aplikasi Monitoring SPPG) disetujui SUPER ADMIN, menunggu pencairan Keuangan.	f	2026-08-26 14:40:28.834
190	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 84.000 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-26 14:41:07.188
191	5	status_update	Pengajuan Reimbursement Anda senilai Rp 681.600 telah disetujui oleh SUPER ADMIN.	f	2026-08-26 14:42:31.757
192	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Testing Refactor) disetujui SUPER ADMIN, menunggu pencairan Keuangan.	f	2026-08-26 14:42:31.95
193	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 681.600 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-26 14:42:55.322
194	5	status_update	Pengajuan Reimbursement Anda senilai Rp 96.000 telah disetujui oleh PM.	f	2026-08-26 16:15:24.698
195	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Aplikasi Monitoring SPPG) disetujui PM, menunggu pencairan Keuangan.	f	2026-08-26 16:15:24.965
196	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 96.000 telah DICAIRKAN oleh Superadmin.	f	2026-08-26 16:23:05.042
197	5	status_update	Pengajuan Reimbursement Anda senilai Rp 84.000 telah disetujui oleh SUPER ADMIN.	f	2026-08-26 16:23:16.271
198	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Aplikasi Monitoring SPPG) disetujui SUPER ADMIN, menunggu pencairan Keuangan.	f	2026-08-26 16:23:16.475
199	3	approval_request	Pengajuan Realisasi baru dari Superadmin Damar Muharram (Proyek: Testing Refactor) menunggu pencairan Keuangan.	f	2026-08-26 16:24:07.037
200	4	PENGAJUAN_DISETUJUI	Pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" untuk proyek Testing Refactor telah disetujui oleh Superadmin. Alokasi Biaya Produksi Proyek diperbarui.	f	2026-08-26 16:31:50.605
201	3	approval_request	Pengajuan Realisasi baru dari Superadmin Damar Muharram (Proyek: Testing Refactor) menunggu pencairan Keuangan.	f	2026-08-26 17:56:39.681
202	3	approval_request	Pengajuan Realisasi baru dari Superadmin Damar Muharram (Proyek: Testing Refactor) menunggu pencairan Keuangan.	f	2026-08-26 17:56:39.704
203	3	approval_request	Pengajuan Realisasi baru dari Superadmin Damar Muharram (Proyek: Testing Refactor) menunggu pencairan Keuangan.	f	2026-08-26 17:57:56.742
204	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 43.500 menunggu validasi Anda.	f	2026-08-26 17:58:55.804
205	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	f	2026-08-27 05:31:12.712
206	2	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	f	2026-08-27 05:31:12.712
207	4	approval_request	Pengajuan reimbursement baru dari UAT Nomor Satu senilai Rp 43.500 menunggu validasi Anda.	f	2026-08-27 05:42:59.005
208	4	PENGAJUAN_DISETUJUI	Pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" untuk proyek Testing Refactor telah disetujui oleh Direktur. Alokasi Biaya Produksi Proyek diperbarui.	f	2026-08-27 05:43:08.069
209	7	status_update	Pengajuan Reimbursement Anda senilai Rp 43.500 telah disetujui oleh PM.	f	2026-08-27 05:44:21.1
210	3	approval_request	Pengajuan Reimbursement UAT Nomor Satu (Proyek: Aplikasi Monitoring SPPG) disetujui PM, menunggu pencairan Keuangan.	f	2026-08-27 05:44:21.288
211	7	disbursed	Pengajuan Reimbursement Anda senilai Rp 43.500 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-27 05:45:26.182
212	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	f	2026-08-27 05:51:24.762
213	2	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	f	2026-08-27 05:51:24.762
214	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 84.000 menunggu validasi Anda.	f	2026-08-27 10:29:31.531
215	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 26.000 menunggu validasi Anda.	f	2026-08-27 10:29:31.707
216	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 273.000 menunggu validasi Anda.	f	2026-08-27 10:29:32.419
217	5	status_update	Pengajuan Reimbursement Anda senilai Rp 84.000 telah ditolak oleh PM.	f	2026-08-27 11:17:43.914
218	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 84.000 menunggu validasi Anda.	f	2026-08-27 11:24:43.289
219	4	PENGAJUAN_DISETUJUI	Pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" untuk proyek Testing Refactor telah disetujui oleh Direktur. Alokasi Biaya Produksi Proyek diperbarui.	f	2026-08-27 11:27:11.444
220	4	PENGAJUAN_DISETUJUI	Pengajuan "Perubahan alokasi anggaran: Biaya Administrasi Proyek" untuk proyek Testing Refactor telah disetujui oleh Direktur. Alokasi Biaya Administrasi Proyek diperbarui.	f	2026-08-27 11:27:12.02
221	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 84.000 menunggu validasi Anda.	f	2026-08-27 11:52:37.018
222	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	f	2026-08-27 13:52:21.837
223	2	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	f	2026-08-27 13:52:21.837
224	4	PENGAJUAN_DITOLAK	Pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" untuk proyek Aplikasi Monitoring SPPG ditolak oleh Direktur.	f	2026-08-27 13:58:43.304
225	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	f	2026-08-27 14:03:56
226	2	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	f	2026-08-27 14:03:56
227	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Aplikasi Monitoring SPPG) menunggu pencairan Keuangan.	f	2026-08-27 14:59:36.249
228	5	status_update	Pengajuan Reimbursement Anda senilai Rp 84.000 telah disetujui oleh PM.	f	2026-08-27 15:17:18.881
229	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Aplikasi Monitoring SPPG) disetujui PM, menunggu pencairan Keuangan.	f	2026-08-27 15:17:19.103
230	5	status_update	Pengajuan Reimbursement Anda senilai Rp 84.000 telah ditolak oleh PM.	f	2026-08-27 15:20:40.193
231	3	approval_request	Pengajuan Realisasi baru dari Project Manager User Manual (Proyek: Last Testing) menunggu pencairan Keuangan.	f	2026-08-27 16:56:32.382
232	8	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 1,700,000 menunggu validasi Anda.	f	2026-08-27 16:59:38.23
233	5	status_update	Pengajuan Reimbursement Anda senilai Rp 1,700,000 telah disetujui oleh PM.	f	2026-08-27 17:00:14.791
234	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Last Testing) disetujui PM, menunggu pencairan Keuangan.	f	2026-08-27 17:00:14.99
235	8	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 5,000,000 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-27 17:00:45.931
236	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 1,700,000 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-27 17:00:52.14
237	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 681,600 menunggu validasi Anda.	f	2026-08-28 04:31:22.487
238	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 84,000 menunggu validasi Anda.	f	2026-08-28 04:31:22.913
239	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 50,000 menunggu validasi Anda.	f	2026-08-28 06:32:21.022
240	4	approval_request	Pengajuan reimbursement baru dari Muhammad Alvin Ababil senilai Rp 70,000 menunggu validasi Anda.	f	2026-08-28 06:32:21.026
241	5	status_update	Pengajuan Reimbursement Anda senilai Rp 70,000 telah disetujui oleh PM.	f	2026-08-28 06:33:35.699
242	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Proyek Baru) disetujui PM, menunggu pencairan Keuangan.	f	2026-08-28 06:33:35.938
243	5	status_update	Pengajuan Reimbursement Anda senilai Rp 50,000 telah ditolak oleh PM.	f	2026-08-28 06:33:58.85
244	5	disbursed	Pengajuan Reimbursement Anda senilai Rp 70,000 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-28 06:34:52.197
245	3	approval_request	Pengajuan Realisasi baru dari Project Manager Muhammad Zaini (Proyek: Proyek Baru) menunggu pencairan Keuangan.	f	2026-08-28 06:37:17.892
246	4	disbursed	Pengajuan Realisasi Anggaran Anda senilai Rp 5,000,000 telah DICAIRKAN oleh Tim Keuangan.	f	2026-08-28 06:37:52.999
247	1	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	f	2026-08-28 06:40:07.837
248	2	PENGAJUAN_ANGGARAN	Pengajuan anggaran baru: "Perubahan alokasi anggaran: Biaya Produksi Proyek" perlu direview	f	2026-08-28 06:40:07.837
249	4	PENGAJUAN_DISETUJUI	Pengajuan "Perubahan alokasi anggaran: Biaya Produksi Proyek" untuk proyek Proyek Baru telah disetujui oleh Direktur. Alokasi Biaya Produksi Proyek diperbarui.	f	2026-08-28 06:40:48.767
250	5	status_update	Pengajuan Reimbursement Anda senilai Rp 273.000 telah disetujui oleh PM.	f	2026-08-28 07:40:25.041
251	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Aplikasi Monitoring SPPG) disetujui PM, menunggu pencairan Keuangan.	f	2026-08-28 07:40:25.259
252	5	status_update	Pengajuan Reimbursement Anda senilai Rp 84,000 telah disetujui oleh PM.	f	2026-08-28 07:52:02.379
253	3	approval_request	Pengajuan Reimbursement Muhammad Alvin Ababil (Proyek: Testing Refactor) disetujui PM, menunggu pencairan Keuangan.	f	2026-08-28 07:52:02.691
\.


--
-- Data for Name: pengajuan_anggaran; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pengajuan_anggaran (id, proyek_id, pengaju_id, main_anggaran_id, judul, deskripsi, status, catatan, alokasi_lama, alokasi_baru, created_at, diproses_pada) FROM stdin;
12	21	4	32	Perubahan alokasi anggaran: Biaya Produksi Proyek	\N	REJECT	\N	400000000.00	392000000.00	2026-08-27 13:52:21.161	2026-08-27 13:58:43.206
13	21	4	32	Perubahan alokasi anggaran: Biaya Produksi Proyek	\N	PENDING	\N	400000000.00	392000000.00	2026-08-27 14:03:55.347	\N
14	41	4	79	Perubahan alokasi anggaran: Biaya Produksi Proyek	\N	DISETUJUI	\N	30000000.00	25000000.00	2026-08-28 06:40:07.077	2026-08-28 06:40:48.546
\.


--
-- Data for Name: proyek; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proyek (id, nama, deskripsi, status, tanggal_mulai, tanggal_selesai) FROM stdin;
22	Aplikasi Netflix	Pembuatan Aplikasi Netflix	DONE	2026-08-21 00:00:00	2026-08-21 00:00:00
34	Testing Refactor 2	\N	AKTIF	2026-08-24 00:00:00	2026-08-27 00:00:00
21	Aplikasi Monitoring SPPG	\N	AKTIF	2026-08-20 00:00:00	2026-08-31 00:00:00
35	UAT Superadmin	Bisa	AKTIF	2026-08-27 00:00:00	2026-10-01 00:00:00
36	UAT Direktur	\N	DONE	2026-08-27 00:00:00	2026-11-01 00:00:00
41	Proyek Baru	\N	PLANNING	2026-08-28 00:00:00	2026-08-28 00:00:00
42	Proyek A	\N	PLANNING	2026-08-28 00:00:00	2026-08-28 00:00:00
23	Aplikasi X	\N	PLANNING	2026-08-21 00:00:00	2026-08-21 00:00:00
24	Renovasi jalanan kiaracondong	\N	AKTIF	2026-08-22 00:00:00	2026-08-31 00:00:00
\.


--
-- Data for Name: reimbursement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reimbursement (id, user_id, proyek_id, keterangan_anggaran_id, nama, tipe, merchant, tanggal_struk, kategori_bukti, created_at, nominal, url_struk, fraud_flag, status) FROM stdin;
79	4	41	29	Gaji Pegawai B	Realisasi Anggaran	\N	2026-08-28 00:00:00	Lainnya	2026-08-28 06:37:16.709	5000000.00		f	APPROVED
69	5	21	15	Pet Island's Dago	Reimbursement	Pet Island's Dago	2026-07-19 00:00:00	Struk Pembelian	2026-08-27 10:29:31.437	273000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787826567919_g62mg1.webp	f	APPROVED_BY_PM
48	1	21	16	Catering	Realisasi Anggaran	\N	2026-08-24 00:00:00	Lainnya	2026-08-24 09:03:37.705	15000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787562215915_yf010a.webp	f	REJECTED
47	1	21	16	Catering	Realisasi Anggaran	\N	2026-08-24 00:00:00	Lainnya	2026-08-24 06:44:38.838	10000.00		f	APPROVED
40	5	21	16	Buah Kuldi	Reimbursement	Buah Kuldi	2019-05-10 00:00:00	Struk Pembelian	2026-08-20 13:30:55.467	7000000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787232654228_yu2d0n.webp	f	APPROVED
39	5	21	15	Alat Pemotong Rumput	Reimbursement	Alat Pemotong Rumput	2024-07-18 00:00:00	Struk Pembelian	2026-08-20 13:30:21.294	38000000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787232618239_mi350u.webp	f	APPROVED
38	4	21	14	Ghanif	Realisasi Anggaran	\N	2026-08-20 00:00:00	Lainnya	2026-08-20 13:29:43.347	50000000.00		f	APPROVED
37	4	21	13	Dais	Realisasi Anggaran	\N	2026-08-20 00:00:00	Lainnya	2026-08-20 13:29:20.097	20000.00		f	APPROVED
36	4	21	12	Damar	Realisasi Anggaran	\N	2026-08-20 00:00:00	Lainnya	2026-08-20 13:29:04.718	2000000.00		f	APPROVED
35	4	21	12	Alif	Realisasi Anggaran	\N	2026-08-20 00:00:00	Lainnya	2026-08-20 13:28:51.082	20000000.00		f	APPROVED
49	1	21	16	Catering Test	Realisasi Anggaran	\N	2026-08-24 00:00:00	Lainnya	2026-08-24 09:14:36.098	20000.00		f	REJECTED
43	5	21	15	HONG LIE Tools Outlet	Reimbursement	HONG LIE Tools Outlet	2026-07-17 00:00:00	Invoice / Faktur	2026-08-20 16:20:50.849	205268.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787242849534_qvt83v.webp	f	APPROVED
46	5	21	15	MEGA RIA Photo Copy	Reimbursement	MEGA RIA Photo Copy	2026-02-18 00:00:00	Nota Kontan	2026-08-24 01:35:53.847	26000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787535352544_jkz5ii.webp	f	APPROVED
45	5	21	15	HONG LIE Tools Outlet	Reimbursement	HONG LIE Tools Outlet	2026-07-17 00:00:00	Invoice / Faktur	2026-08-24 01:35:53.84	205268.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787535352565_zj3rbf.webp	f	APPROVED
44	5	21	15	JAYA MANDIR	Reimbursement	JAYA MANDIR	2026-07-17 00:00:00	Nota Kontan	2026-08-24 01:35:53.446	84000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787535351653_edfk3o.webp	f	APPROVED
42	5	21	15	MEGA RIA Photo Copy 29	Reimbursement	MEGA RIA Photo Copy 29	2026-02-10 00:00:00	Nota Kontan	2026-08-20 16:20:50.749	96000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787242849524_fco9mo.webp	f	APPROVED
41	5	21	15	JAYA MANDIR	Reimbursement	JAYA MANDIR	2026-07-17 00:00:00	Nota Kontan	2026-08-20 16:20:50.255	84000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787242848493_yt05a5.webp	f	APPROVED_BY_PM
66	7	21	12	BreadTalk	Reimbursement	BreadTalk	2026-05-10 00:00:00	Struk Pembelian	2026-08-27 05:42:58.036	43500.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787809376508_a73yon.webp	f	APPROVED
68	5	21	12	MEGA RIA Photo Copy	Reimbursement	MEGA RIA Photo Copy	2026-07-10 00:00:00	Nota Kontan	2026-08-27 10:29:30.51	26000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787826567813_uaj29l.webp	f	SUBMITTED
67	5	21	12	Jaya Mandiri	Reimbursement	Jaya Mandiri	2026-07-17 00:00:00	Nota Kontan	2026-08-27 10:29:30.418	84000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787826567819_pfnxbz.webp	f	REJECTED
70	5	21	12	Jaya Mandiri	Reimbursement	Jaya Mandiri	2026-07-17 00:00:00	Nota Kontan	2026-08-27 11:24:42.371	84000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787826567819_pfnxbz.webp	f	REJECTED
72	4	21	12	Gaji Alif	Realisasi Anggaran	\N	2026-08-27 00:00:00	Lainnya	2026-08-27 14:59:35.16	30000000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787842773631_xf0lnr.webp	f	APPROVED_BY_PM
71	5	21	12	Jaya Mandiri	Reimbursement	Jaya Mandiri	2026-07-17 00:00:00	Nota Kontan	2026-08-27 11:52:36.021	84000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787826567819_pfnxbz.webp	f	APPROVED_BY_PM
77	5	41	28	Beli Perabotan	Reimbursement	Beli Perabotan	2026-08-28 00:00:00	Struk Pembelian	2026-08-28 06:32:19.937	50000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787898738190_4z7rd3.webp	f	REJECTED
78	5	41	28	Beli Bulanan	Reimbursement	Beli Bulanan	2023-08-02 00:00:00	Struk Pembelian	2026-08-28 06:32:19.938	70000.00	https://dndluxlfsdjotjcqotfp.supabase.co/storage/v1/object/public/struk-reimbursement/struk_1787898738197_qmtlyh.webp	f	APPROVED
\.


--
-- Data for Name: sub_anggaran; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sub_anggaran (id, main_anggaran_id, nama_sub, nominal_alokasi, nominal_terpakai, tipe) FROM stdin;
39	42	Penjualan Jasa	20000000.00	0.00	pemasukan
40	41	Biaya Personil	1000000.00	0.00	pengeluaran
33	32	Biaya Personil	180000000.00	0.00	pengeluaran
54	37	Penjualan Jasa	0.00	0.00	pemasukan
55	56	Penjualan Jasa	20000000.00	0.00	pemasukan
56	30	Biaya Marketing Proyek	50000000.00	0.00	pengeluaran
62	68	Penjualan Barang	50000000.00	0.00	pemasukan
34	32	Biaya Pengadaan Barang dan Jasa	200000000.00	0.00	pengeluaran
63	48	Retur Penjualan Jasa	0.00	0.00	pemasukan
64	48	Diskon Penjualan Jasa	0.00	0.00	pemasukan
42	48	Penjualan Jasa	300000000.00	3000000.00	pemasukan
66	32	Biaya Non Personil	10000000.00	0.00	pengeluaran
65	69	Penjualan Barang	40000000.00	100000000.00	pemasukan
73	76	Penjualan Jasa	30000000.00	0.00	pemasukan
74	77	Biaya Marketing Proyek	20000000.00	0.00	pengeluaran
76	79	Biaya Personil	20000000.00	0.00	pengeluaran
75	79	Biaya Pengadaan Barang dan Jasa	5000000.00	0.00	pengeluaran
\.


--
-- Data for Name: termin_pembayaran; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.termin_pembayaran (id, proyek_id, nama_termin, urutan, persentase_progress, nominal, status, tanggal_pencairan, catatan, created_at, updated_at) FROM stdin;
141	34	Termin 3	4	30.00	30000000.00	BELUM_DITERIMA	\N	\N	2026-08-27 04:58:41.245	2026-08-27 04:58:41.245
138	34	Termin 0	1	20.00	20000000.00	DITERIMA	2026-08-27 00:00:00	\N	2026-08-27 04:58:40.948	2026-08-27 04:59:35.672
139	34	Termin 1	2	30.00	30000000.00	DITERIMA	2026-08-27 00:00:00	\N	2026-08-27 04:58:41.055	2026-08-27 05:07:03.412
140	34	Termin 2	3	20.00	20000000.00	DITERIMA	2026-08-27 00:00:00	\N	2026-08-27 04:58:41.15	2026-08-27 05:10:37.867
148	35	Termin 1	1	40.00	40000000.00	DITERIMA	2026-08-27 00:00:00	\N	2026-08-27 05:31:11.39	2026-08-27 05:42:48.17
126	21	Termin 0	1	0.00	50000000.00	DITERIMA	2026-08-20 00:00:00	\N	2026-08-20 13:33:47.315	2026-08-27 12:41:46.051
157	21	Termin 1	2	50.00	500000000.00	BELUM_DITERIMA	\N	\N	2026-08-27 12:41:46.332	2026-08-27 12:41:46.332
158	21	Termin 2	3	45.00	450000000.00	BELUM_DITERIMA	\N	\N	2026-08-27 12:41:46.613	2026-08-27 12:41:46.613
145	36	Termin 1	1	10.00	10000000.00	DITERIMA	2026-08-27 00:00:00	\N	2026-08-27 05:29:32.359	2026-08-27 13:03:35.416
162	36	Termin 2	2	40.00	40000000.00	BELUM_DITERIMA	\N	\N	2026-08-27 13:03:35.7	2026-08-27 13:03:35.7
163	36	Termin 3	3	50.00	50000000.00	BELUM_DITERIMA	\N	\N	2026-08-27 13:03:35.983	2026-08-27 13:03:35.983
183	41	Termin 1	2	20.00	20000000.00	BELUM_DITERIMA	\N	\N	2026-08-28 06:41:36.056	2026-08-28 06:41:36.056
184	41	Termin 2	3	30.00	30000000.00	BELUM_DITERIMA	\N	\N	2026-08-28 06:41:36.387	2026-08-28 06:41:36.387
152	35	Termin 2	2	60.00	60000000.00	DITERIMA	2026-08-27 00:00:00	\N	2026-08-27 05:42:48.449	2026-08-27 15:33:50.36
182	41	Termin 0	1	50.00	50000000.00	DITERIMA	2026-08-28 00:00:00	\N	2026-08-28 06:41:35.726	2026-08-28 06:41:49.537
\.


--
-- Data for Name: transaksi_pemasukan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transaksi_pemasukan (id, proyek_id, user_id, sub_coa_id, kategori, nominal, tanggal_transaksi, keterangan, bukti_url, status, created_at, updated_at) FROM stdin;
6	21	3	36	Retur Penjualan Jasa	25000000.00	2026-08-20 00:00:00	Pengembalian Uang Daisaq	\N	CAIR	2026-08-20 13:36:21.074	2026-08-20 13:36:21.074
7	21	3	37	Biaya Penjualan Jasa Lainnya	500000.00	2026-08-20 00:00:00	Penjualan Bakso	\N	CAIR	2026-08-20 13:38:33.304	2026-08-20 13:38:33.304
8	21	2	32	PENERIMAAN_PENJUALAN	882980000.00	2026-08-20 13:41:48.916	Realisasi Pendapatan Penjualan Proyek Selesai: Aplikasi Monitoring SPPG	\N	CAIR	2026-08-20 13:41:48.916	2026-08-21 04:02:40.178
9	22	2	38	PENERIMAAN_PENJUALAN	100000000.00	2026-08-21 07:09:20.976	Realisasi Pendapatan Penjualan Proyek Selesai: Aplikasi Netflix	\N	CAIR	2026-08-21 07:09:20.976	2026-08-25 13:25:04.805
11	21	3	34	Penjualan Jasa	1000000.00	2026-08-27 00:00:00	Gramedia	\N	CAIR	2026-08-27 12:01:14.092	2026-08-27 12:01:14.092
12	21	3	34	Penjualan Jasa	1000000.00	2026-08-27 00:00:00	Gramedia 2	\N	CAIR	2026-08-27 12:02:54.528	2026-08-27 12:02:54.528
13	21	1	34	Penjualan Jasa	1000000.00	2026-08-27 00:00:00	SUperadmin Gramedia	\N	CAIR	2026-08-27 12:07:01.857	2026-08-27 12:07:01.857
20	36	2	38	PENERIMAAN_PENJUALAN	100000000.00	2026-08-27 18:00:43.886	Realisasi Pendapatan Penjualan Proyek Selesai: UAT Direktur	\N	CAIR	2026-08-27 18:00:43.886	2026-08-27 18:00:43.886
\.


--
-- Data for Name: user_proyek; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_proyek (id, proyek_id, user_id, role, divisi, joined_at) FROM stdin;
12	21	4	Project Manager	\N	2026-08-20 13:24:24.085
13	21	5	Anggota Lapangan	Karyawan 1	2026-08-20 13:24:24.085
14	23	4	Project Manager	\N	2026-08-21 07:22:25.323
15	22	4	Project Manager	\N	2026-08-23 09:38:47.197
16	22	5	Anggota Lapangan	Karyawan	2026-08-23 09:38:47.197
25	24	7	Anggota Lapangan	\N	2026-08-27 05:23:56.241
27	21	7	Anggota Lapangan	\N	2026-08-27 05:23:56.241
28	36	7	Anggota Lapangan	\N	2026-08-27 05:23:56.241
29	35	7	Anggota Lapangan	\N	2026-08-27 05:23:56.241
33	36	8	Project Manager	\N	2026-08-27 15:44:58.031
34	35	8	Project Manager	\N	2026-08-27 15:44:58.031
38	41	5	Anggota Lapangan	Back End	2026-08-28 06:30:00.959
39	41	4	Project Manager	\N	2026-08-28 06:30:00.959
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, nama, email, password_hash, role) FROM stdin;
1	Damar Muharram	superadmin@digi.com	$2b$10$zJQktLIO74U0REdgBRQkH.J9jqaMLx/NhDixOOCZOUu3FNSsUkS9e	Superadmin
2	Alif Ihsan	direktur@digi.com	$2b$10$4p8cSyYZgUwpSjxyYY2/6Oe9PqRQ8mHRtDOklDl9JBTEOaVp8qu5q	Direktur / Manajemen
3	Ghanif Hadiyana Akbar	keuangan@digi.com	$2b$10$LXlZtOm4kKOuM0C/Cpy37OQk0dl36hZwLeRhGXQDfAVbNbI874Au6	Tim Keuangan
4	Muhammad Zaini	pm@digi.com	$2b$10$3MI9DkwZ1PmGl2Nzxf.T4.UF5lY1lOjn5ixG.bQqUZ1sqFLNkzh2e	Project Manager
5	Muhammad Alvin Ababil	karyawan@digi.com	$2b$10$GjuGiTpPOAiMcAhnnD0Px.ryiC9O.SkRfFyz85NR1lAgg5AHRyWPi	Karyawan
6	damar hassan	damarhassan@digi.com	$2b$10$qYj0D9KqAzRdv.NR4QcjhumlcZnEBkFpzpeuAs3hasyDfEqGFo23a	Karyawan
7	UAT Nomor Satu	uat@digi.com	$2b$10$0r/W9/6zMafhQQ0.Q75EC.3OW5j9uLMMO08/n9vKDM6.39NQfwG.2	Karyawan
8	User Manual	usermanual@digi.com	$2b$10$GZ84HUIKTsivj7oesBA2cOxPPFRwse/puAqdnPfbTpT7HavQx.P3C	Project Manager
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-08-10 10:56:53
20211116045059	2026-08-10 10:56:53
20211116050929	2026-08-10 10:56:53
20211116051442	2026-08-10 10:56:53
20211116212300	2026-08-10 10:56:53
20211116213355	2026-08-10 10:56:53
20211116213934	2026-08-10 10:56:53
20211116214523	2026-08-10 10:56:53
20211122062447	2026-08-10 10:56:53
20211124070109	2026-08-10 10:56:53
20211202204204	2026-08-10 10:56:53
20211202204605	2026-08-10 10:56:53
20211210212804	2026-08-10 10:56:53
20211228014915	2026-08-10 10:56:53
20220107221237	2026-08-10 10:56:53
20220228202821	2026-08-10 10:56:53
20220312004840	2026-08-10 10:56:53
20220603231003	2026-08-10 10:56:53
20220603232444	2026-08-10 10:56:53
20220615214548	2026-08-10 10:56:53
20220712093339	2026-08-10 10:56:53
20220908172859	2026-08-10 10:56:53
20220916233421	2026-08-10 10:56:53
20230119133233	2026-08-10 10:56:53
20230128025114	2026-08-10 10:56:53
20230128025212	2026-08-10 10:56:53
20230227211149	2026-08-10 10:56:53
20230228184745	2026-08-10 10:56:53
20230308225145	2026-08-10 10:56:53
20230328144023	2026-08-10 10:56:53
20231018144023	2026-08-10 10:56:53
20231204144023	2026-08-10 10:56:53
20231204144024	2026-08-10 10:56:53
20231204144025	2026-08-10 10:56:53
20240108234812	2026-08-10 10:56:53
20240109165339	2026-08-10 10:56:53
20240227174441	2026-08-10 10:56:53
20240311171622	2026-08-10 10:56:53
20240321100241	2026-08-10 10:56:53
20240401105812	2026-08-10 10:56:53
20240418121054	2026-08-10 10:56:53
20240523004032	2026-08-10 10:56:53
20240618124746	2026-08-10 10:56:53
20240801235015	2026-08-10 10:56:53
20240805133720	2026-08-10 10:56:53
20240827160934	2026-08-10 10:56:53
20240919163303	2026-08-10 10:56:53
20240919163305	2026-08-10 10:56:53
20241019105805	2026-08-10 10:56:53
20241030150047	2026-08-10 10:56:53
20241108114728	2026-08-10 10:56:53
20241121104152	2026-08-10 10:56:53
20241130184212	2026-08-10 10:56:53
20241220035512	2026-08-10 10:56:53
20241220123912	2026-08-10 10:56:53
20241224161212	2026-08-10 10:56:53
20250107150512	2026-08-10 10:56:53
20250110162412	2026-08-10 10:56:53
20250123174212	2026-08-10 10:56:53
20250128220012	2026-08-10 10:56:53
20250506224012	2026-08-10 10:56:53
20250523164012	2026-08-10 10:56:53
20250714121412	2026-08-10 10:56:53
20250905041441	2026-08-10 10:56:53
20251103001201	2026-08-10 10:56:53
20251120212548	2026-08-10 10:56:53
20251120215549	2026-08-10 10:56:53
20260218120000	2026-08-10 10:56:53
20260326120000	2026-08-10 10:56:53
20260514120000	2026-08-10 10:56:53
20260527120000	2026-08-10 10:56:53
20260528120000	2026-08-10 10:56:53
20260603120000	2026-08-10 10:56:53
20260605120000	2026-08-10 10:56:53
20260606110000	2026-08-10 10:56:53
20260616120000	2026-08-10 10:56:53
20260624120000	2026-08-10 10:56:53
20260626120000	2026-08-10 10:56:53
20260706120000	2026-08-10 10:56:53
20260707120000	2026-08-10 10:56:53
20260709120000	2026-08-10 10:56:53
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_realtime_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter, selected_columns) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type, versioning_status) FROM stdin;
struk-reimbursement	struk-reimbursement	\N	2026-08-10 11:18:59.083515+00	2026-08-10 11:18:59.083515+00	t	f	\N	\N	\N	STANDARD	DISABLED
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-08-10 10:10:25.351234
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-08-10 10:10:25.408727
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-08-10 10:10:25.425032
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-08-10 10:10:25.461192
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-08-10 10:10:25.495251
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-08-10 10:10:25.509894
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-08-10 10:10:25.524693
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-08-10 10:10:25.536043
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-08-10 10:10:25.548205
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-08-10 10:10:25.560227
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-08-10 10:10:25.571588
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-08-10 10:10:25.582541
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-08-10 10:10:25.598464
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-08-10 10:10:25.608126
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-08-10 10:10:25.635923
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-08-10 10:10:25.787948
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-08-10 10:10:25.797629
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-08-10 10:10:25.808589
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-08-10 10:10:25.819015
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-08-10 10:10:25.832899
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-08-10 10:10:25.849373
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-08-10 10:10:25.867511
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-08-10 10:10:25.901682
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-08-10 10:10:25.919174
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-08-10 10:10:25.928512
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-08-10 10:10:25.937931
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-08-10 10:10:25.94841
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-08-10 10:10:25.960151
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-08-10 10:10:25.970637
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-08-10 10:10:25.982475
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-08-10 10:10:25.993756
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-08-10 10:10:26.005647
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-08-10 10:10:26.014818
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-08-10 10:10:26.024304
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-08-10 10:10:26.035131
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-08-10 10:10:26.045867
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-08-10 10:10:26.055597
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-08-10 10:10:26.065613
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-08-10 10:10:26.091827
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-08-10 10:10:26.121552
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-08-10 10:10:26.130346
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-08-10 10:10:26.139203
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-08-10 10:10:26.148468
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-08-10 10:10:26.157643
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-08-10 10:10:26.167415
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-08-10 10:10:26.177956
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-08-10 10:10:26.392114
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-08-10 10:10:26.408473
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-08-10 10:10:26.421232
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-08-10 10:10:26.486813
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-08-10 10:10:26.499674
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-08-10 10:10:27.093856
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-08-10 10:10:27.174093
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-08-10 10:10:27.303006
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-08-10 10:10:27.314713
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-08-10 10:10:27.327227
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-08-10 10:10:27.344031
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-08-10 10:10:27.355629
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-08-10 10:10:27.365525
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-08-10 10:10:27.378087
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-08-10 10:10:27.388329
61	mark-filename-immutable	fe0096517ae9d60aaec1d110172ba9036dc66bb7	2026-08-12 08:32:36.39638
62	object-versioning-core	0b855f00ff3be0bfca91efee02a9858912491a9a	2026-08-20 10:59:35.852499
63	fix-search-name-relative-to-prefix	c7485e417624f795ce8bb2da21927f48e088904d	2026-08-23 06:52:53.025439
64	fix-search-by-timestamp-sqli	0af424ecd388a39bb1645184b222185a12149675	2026-08-23 06:52:53.061221
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, archived_at, is_delete_marker, is_versioned) FROM stdin;
0f1f1bbb-f0dc-4ed4-bf3a-0affebee8ec4	struk-reimbursement	struk_1787535351653_edfk3o.webp	\N	2026-08-24 01:35:52.719387+00	2026-08-24 01:35:52.719387+00	2026-08-24 01:35:52.719387+00	{"eTag": "\\"1723bfb1a8c11f2fb48fcf5d587261d6\\"", "size": 126606, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-24T01:35:53.000Z", "contentLength": 126606, "httpStatusCode": 200}	b654bebb-97e2-4933-8678-2d2806b5c8d3	\N	{}	\N	f	f
c610aca7-18c7-4ac3-a0e2-88c32202fce1	struk-reimbursement	struk_1787535352565_zj3rbf.webp	\N	2026-08-24 01:35:53.170478+00	2026-08-24 01:35:53.170478+00	2026-08-24 01:35:53.170478+00	{"eTag": "\\"197c0a28f96c7e8d344261c8418ef1bc\\"", "size": 103706, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-24T01:35:54.000Z", "contentLength": 103706, "httpStatusCode": 200}	ef54c4e1-dbcf-4989-a0e4-e0e77547944a	\N	{}	\N	f	f
a35d864b-40ad-4515-b1bb-468f16ce6805	struk-reimbursement	struk_1787535352544_jkz5ii.webp	\N	2026-08-24 01:35:53.185162+00	2026-08-24 01:35:53.185162+00	2026-08-24 01:35:53.185162+00	{"eTag": "\\"50a2cd7808146f3aa72da9f9a40c3a9e\\"", "size": 105506, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-24T01:35:54.000Z", "contentLength": 105506, "httpStatusCode": 200}	20578b79-da3d-49ea-8385-88a647feff3e	\N	{}	\N	f	f
3b6b99ac-60d4-4e5b-87b6-3af362809a1a	struk-reimbursement	.emptyFolderPlaceholder	\N	2026-08-11 04:27:13.912632+00	2026-08-11 04:27:13.912632+00	2026-08-11 04:27:13.912632+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2026-08-11T04:27:13.917Z", "contentLength": 0, "httpStatusCode": 200}	41fe58e6-ad83-4f4a-ab36-e6b37fdc67d3	\N	{}	\N	f	f
2434e894-8c3a-4ed1-8fb4-f61f08f92149	struk-reimbursement	struk_1786974432239_4nne5a.webp	\N	2026-08-17 13:47:13.005447+00	2026-08-17 13:47:13.005447+00	2026-08-17 13:47:13.005447+00	{"eTag": "\\"28b18ba15625a1eb9c41d13155881c41\\"", "size": 31418, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-17T13:47:13.000Z", "contentLength": 31418, "httpStatusCode": 200}	3cc0e0cd-cfe7-4c05-9665-ad1d9d074cb8	\N	{}	\N	f	f
bb865689-ea7c-49b8-a2c2-3bf766c68012	struk-reimbursement	struk_1786977716339_3k7mnv.webp	\N	2026-08-17 14:41:57.159047+00	2026-08-17 14:41:57.159047+00	2026-08-17 14:41:57.159047+00	{"eTag": "\\"12bbea1ccd400d3131a78baf1b5458b8\\"", "size": 34052, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-17T14:41:58.000Z", "contentLength": 34052, "httpStatusCode": 200}	e1675822-f61b-48d7-a96d-3fad548c38d5	\N	{}	\N	f	f
47834ed3-fcc1-4da0-9c53-4f5e1c43096d	struk-reimbursement	struk_1787043088353_r8rx0a.webp	\N	2026-08-18 08:51:29.148593+00	2026-08-18 08:51:29.148593+00	2026-08-18 08:51:29.148593+00	{"eTag": "\\"e1996b1241fb999f7201c9a693143fa4\\"", "size": 18328, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-18T08:51:30.000Z", "contentLength": 18328, "httpStatusCode": 200}	e8f01386-dc46-4cea-88df-778ab1219ac7	\N	{}	\N	f	f
f2dc3052-ac05-46d9-8d52-4cde1991b652	struk-reimbursement	struk_1787054033469_uxkbvm.webp	\N	2026-08-18 11:53:54.761008+00	2026-08-18 11:53:54.761008+00	2026-08-18 11:53:54.761008+00	{"eTag": "\\"24c1afe7fd1006541f658ce5c2226afe\\"", "size": 174658, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-18T11:53:55.000Z", "contentLength": 174658, "httpStatusCode": 200}	e74ad337-9ba8-4343-bac8-67ff3728e319	\N	{}	\N	f	f
45117c87-4b20-4494-b510-705aa772ceda	struk-reimbursement	struk_1787054038526_v8vma9.webp	\N	2026-08-18 11:53:59.378064+00	2026-08-18 11:53:59.378064+00	2026-08-18 11:53:59.378064+00	{"eTag": "\\"197c0a28f96c7e8d344261c8418ef1bc\\"", "size": 103706, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-18T11:54:00.000Z", "contentLength": 103706, "httpStatusCode": 200}	ded23daf-9966-4547-8408-d13e89ef300e	\N	{}	\N	f	f
bbb4d8cb-35a1-4b07-b27f-9302f3f42ec4	struk-reimbursement	struk_1787054042060_e9s7vy.webp	\N	2026-08-18 11:54:02.740944+00	2026-08-18 11:54:02.740944+00	2026-08-18 11:54:02.740944+00	{"eTag": "\\"50a2cd7808146f3aa72da9f9a40c3a9e\\"", "size": 105506, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-18T11:54:03.000Z", "contentLength": 105506, "httpStatusCode": 200}	b271777a-5ff1-45a4-b963-a040c7bfe86f	\N	{}	\N	f	f
cdd50d49-65f3-40a3-bca3-1601305fc15c	struk-reimbursement	struk_1787054044032_k9or8l.pdf	\N	2026-08-18 11:54:05.024157+00	2026-08-18 11:54:05.024157+00	2026-08-18 11:54:05.024157+00	{"eTag": "\\"51a01f31db1ed78c9e47e3fde3b382d2\\"", "size": 236307, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-08-18T11:54:05.000Z", "contentLength": 236307, "httpStatusCode": 200}	90551ba7-1d23-4a6b-8b6e-c811989f1571	\N	{}	\N	f	f
8762189b-94c7-4cb7-b741-118af534124b	struk-reimbursement	struk_1787146347666_y5ta9g.webp	\N	2026-08-19 13:32:29.208817+00	2026-08-19 13:32:29.208817+00	2026-08-19 13:32:29.208817+00	{"eTag": "\\"24c1afe7fd1006541f658ce5c2226afe\\"", "size": 174658, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-19T13:32:30.000Z", "contentLength": 174658, "httpStatusCode": 200}	5e3bcaa8-14fb-4bdc-ace2-4e32b5b3646b	\N	{}	\N	f	f
3683d01e-01fc-423a-9232-cf8e9afee0b1	struk-reimbursement	struk_1787146357990_j126b8.webp	\N	2026-08-19 13:32:38.896688+00	2026-08-19 13:32:38.896688+00	2026-08-19 13:32:38.896688+00	{"eTag": "\\"197c0a28f96c7e8d344261c8418ef1bc\\"", "size": 103706, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-19T13:32:39.000Z", "contentLength": 103706, "httpStatusCode": 200}	1f1401d8-cd85-4a4e-8ac1-b920aadea967	\N	{}	\N	f	f
f85d530e-d599-4afd-b8c0-e30d74cc1a54	struk-reimbursement	struk_1787146370656_2ahcx3.webp	\N	2026-08-19 13:32:51.736363+00	2026-08-19 13:32:51.736363+00	2026-08-19 13:32:51.736363+00	{"eTag": "\\"50a2cd7808146f3aa72da9f9a40c3a9e\\"", "size": 105506, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-19T13:32:52.000Z", "contentLength": 105506, "httpStatusCode": 200}	24ca5fd5-b445-4280-b49b-77c1f7825d23	\N	{}	\N	f	f
86065082-e122-4328-bef3-dd86aa043802	struk-reimbursement	struk_1787146374852_7bq27x.pdf	\N	2026-08-19 13:32:55.70153+00	2026-08-19 13:32:55.70153+00	2026-08-19 13:32:55.70153+00	{"eTag": "\\"51a01f31db1ed78c9e47e3fde3b382d2\\"", "size": 236307, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-08-19T13:32:56.000Z", "contentLength": 236307, "httpStatusCode": 200}	dde183e6-4ea7-4a5c-ba7b-82a26786205d	\N	{}	\N	f	f
07ca4d84-1356-4091-b87c-dabe518d09c9	struk-reimbursement	struk_1787562215915_yf010a.webp	\N	2026-08-24 09:03:37.320316+00	2026-08-24 09:03:37.320316+00	2026-08-24 09:03:37.320316+00	{"eTag": "\\"e1996b1241fb999f7201c9a693143fa4\\"", "size": 18328, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-24T09:03:38.000Z", "contentLength": 18328, "httpStatusCode": 200}	cd11dc42-3f85-444e-8da4-5c837bd823a6	\N	{}	\N	f	f
2614f014-9ad1-4684-82ab-0fd58d78ebfc	struk-reimbursement	struk_1787223574063_qen4ph.webp	\N	2026-08-20 10:59:34.912222+00	2026-08-20 10:59:34.912222+00	2026-08-20 10:59:34.912222+00	{"eTag": "\\"84639b985ef535672914f86b16750091\\"", "size": 31194, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-20T10:59:35.000Z", "contentLength": 31194, "httpStatusCode": 200}	c441f958-dd24-4e6e-9839-f967933afe2e	\N	{}	\N	f	f
db4f7055-d5f7-42ea-94cd-96dd8eef8f23	struk-reimbursement	struk_1787630637822_m0ng48.webp	\N	2026-08-25 04:03:58.786628+00	2026-08-25 04:03:58.786628+00	2026-08-25 04:03:58.786628+00	{"eTag": "\\"e8dc389bd886dbc5d67ff255b940ff41\\"", "size": 26108, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-25T04:03:59.000Z", "contentLength": 26108, "httpStatusCode": 200}	0655a0e6-f0bd-4f52-8641-affec99a7025	\N	{}	\N	f	f
1a454d24-1c35-450f-808b-25ee2e1cd7a8	struk-reimbursement	struk_1787223612720_eud2tl.webp	\N	2026-08-20 11:00:13.146297+00	2026-08-20 11:00:13.146297+00	2026-08-20 11:00:13.146297+00	{"eTag": "\\"ec1c59d929c2de783d65d7650b848448\\"", "size": 22646, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-20T11:00:14.000Z", "contentLength": 22646, "httpStatusCode": 200}	07069c8d-bd41-4414-994e-ec12e21a5b03	\N	{}	\N	f	f
99fc5f70-a0a9-4ffe-ac57-211d835b97c7	struk-reimbursement	struk_1787232618239_mi350u.webp	\N	2026-08-20 13:30:20.166508+00	2026-08-20 13:30:20.166508+00	2026-08-20 13:30:20.166508+00	{"eTag": "\\"ec1c59d929c2de783d65d7650b848448\\"", "size": 22646, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-20T13:30:21.000Z", "contentLength": 22646, "httpStatusCode": 200}	06d8cf81-8b3c-4833-a0c8-0fb105095982	\N	{}	\N	f	f
0fd0b3af-0e2d-4a80-87b4-5d0a602a7f90	struk-reimbursement	struk_1787630777268_jmi9oi.webp	\N	2026-08-25 04:06:19.227486+00	2026-08-25 04:06:19.227486+00	2026-08-25 04:06:19.227486+00	{"eTag": "\\"e1996b1241fb999f7201c9a693143fa4\\"", "size": 18328, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-25T04:06:20.000Z", "contentLength": 18328, "httpStatusCode": 200}	6d88258c-0c93-4124-a192-80542f5e5598	\N	{}	\N	f	f
9378c32d-2991-4b25-b9f4-6d8a34901d73	struk-reimbursement	struk_1787232654228_yu2d0n.webp	\N	2026-08-20 13:30:54.579432+00	2026-08-20 13:30:54.579432+00	2026-08-20 13:30:54.579432+00	{"eTag": "\\"12bbea1ccd400d3131a78baf1b5458b8\\"", "size": 34052, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-20T13:30:55.000Z", "contentLength": 34052, "httpStatusCode": 200}	a92f363b-b708-4767-87c1-99e864496985	\N	{}	\N	f	f
92fa4a32-0158-4891-a6da-f42394a47815	struk-reimbursement	struk_1787242848493_yt05a5.webp	\N	2026-08-20 16:20:50.453791+00	2026-08-20 16:20:50.453791+00	2026-08-20 16:20:50.453791+00	{"eTag": "\\"bdeb4e7fc3ee29078efd6bb0db069185\\"", "size": 126578, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-20T16:20:51.000Z", "contentLength": 126578, "httpStatusCode": 200}	07b9bb78-cf18-401c-bfd8-97f405382cb4	\N	{}	\N	f	f
5548c14f-e27e-48be-ab26-2f2039f84aff	struk-reimbursement	struk_1787630832724_nx0pw5.webp	\N	2026-08-25 04:07:13.245968+00	2026-08-25 04:07:13.245968+00	2026-08-25 04:07:13.245968+00	{"eTag": "\\"e1996b1241fb999f7201c9a693143fa4\\"", "size": 18328, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-25T04:07:14.000Z", "contentLength": 18328, "httpStatusCode": 200}	19a735a5-ac61-46d9-9f97-a3d19b94c9ae	\N	{}	\N	f	f
6b382e5c-7753-47de-8fe6-6ea3723f2a2a	struk-reimbursement	struk_1787242849524_fco9mo.webp	\N	2026-08-20 16:20:51.042073+00	2026-08-20 16:20:51.042073+00	2026-08-20 16:20:51.042073+00	{"eTag": "\\"50a2cd7808146f3aa72da9f9a40c3a9e\\"", "size": 105506, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-20T16:20:51.000Z", "contentLength": 105506, "httpStatusCode": 200}	121269b5-7ec4-4b02-9fc9-7efed3137477	\N	{}	\N	f	f
3ff0a5a3-330b-4d1e-baf1-f3d51d0ef4c1	struk-reimbursement	struk_1787242849534_qvt83v.webp	\N	2026-08-20 16:20:51.128994+00	2026-08-20 16:20:51.128994+00	2026-08-20 16:20:51.128994+00	{"eTag": "\\"197c0a28f96c7e8d344261c8418ef1bc\\"", "size": 103706, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-20T16:20:52.000Z", "contentLength": 103706, "httpStatusCode": 200}	8a928384-595a-4421-836f-9033ca2e2f9e	\N	{}	\N	f	f
4503ef3b-ee32-4081-b8cf-f92b55bc8466	struk-reimbursement	struk_1787656516441_yocfzv.webp	\N	2026-08-25 11:15:18.090253+00	2026-08-25 11:15:18.090253+00	2026-08-25 11:15:18.090253+00	{"eTag": "\\"e8dc389bd886dbc5d67ff255b940ff41\\"", "size": 26108, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-25T11:15:19.000Z", "contentLength": 26108, "httpStatusCode": 200}	01592e7e-4008-40f5-bf3e-6a0532f46c94	\N	{}	\N	f	f
6a843019-ec26-42eb-be59-d6c4b3cec5de	struk-reimbursement	struk_1787656516435_3orlqj.webp	\N	2026-08-25 11:15:18.090632+00	2026-08-25 11:15:18.090632+00	2026-08-25 11:15:18.090632+00	{"eTag": "\\"e1996b1241fb999f7201c9a693143fa4\\"", "size": 18328, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-25T11:15:19.000Z", "contentLength": 18328, "httpStatusCode": 200}	109cb870-dad7-4ac9-9d86-46b2cfc0cc4d	\N	{}	\N	f	f
643f9275-e671-4278-97ed-269e1e8424e3	struk-reimbursement	struk_1787656516366_nur9a2.webp	\N	2026-08-25 11:15:18.097925+00	2026-08-25 11:15:18.097925+00	2026-08-25 11:15:18.097925+00	{"eTag": "\\"0c41ac1c935f81393639353d0d28e4a7\\"", "size": 5992, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-25T11:15:19.000Z", "contentLength": 5992, "httpStatusCode": 200}	b7968982-db8e-4a8c-9eb8-f188140817f5	\N	{}	\N	f	f
5a483f2a-6f87-4121-ac79-03e0aa75c7a1	struk-reimbursement	struk_1787656516264_w6mux6.pdf	\N	2026-08-25 11:15:18.142901+00	2026-08-25 11:15:18.142901+00	2026-08-25 11:15:18.142901+00	{"eTag": "\\"51a01f31db1ed78c9e47e3fde3b382d2\\"", "size": 236307, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-08-25T11:15:19.000Z", "contentLength": 236307, "httpStatusCode": 200}	2c06985d-05fd-46eb-9e72-146519b5025d	\N	{}	\N	f	f
9398d58f-3b7b-420d-a0da-9a5cbcf4d413	struk-reimbursement	struk_1787658353341_e6j81u.pdf	\N	2026-08-25 11:45:54.323167+00	2026-08-25 11:45:54.323167+00	2026-08-25 11:45:54.323167+00	{"eTag": "\\"51a01f31db1ed78c9e47e3fde3b382d2\\"", "size": 236307, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-08-25T11:45:55.000Z", "contentLength": 236307, "httpStatusCode": 200}	8ae2bea2-9255-4d12-8f54-0f380df2bd51	\N	{}	\N	f	f
bd5923c9-b9ff-4749-9cae-a33b292f3529	struk-reimbursement	struk_1787766996817_miir0t.webp	\N	2026-08-26 17:56:38.460943+00	2026-08-26 17:56:38.460943+00	2026-08-26 17:56:38.460943+00	{"eTag": "\\"e1996b1241fb999f7201c9a693143fa4\\"", "size": 18328, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-26T17:56:39.000Z", "contentLength": 18328, "httpStatusCode": 200}	fc92b4c1-9f9d-41d2-b1ac-ccd56f7ffd72	\N	{}	\N	f	f
22cd945f-3225-4fed-987c-ea1becadd090	struk-reimbursement	struk_1787766996791_pe5tq7.webp	\N	2026-08-26 17:56:38.47191+00	2026-08-26 17:56:38.47191+00	2026-08-26 17:56:38.47191+00	{"eTag": "\\"0c41ac1c935f81393639353d0d28e4a7\\"", "size": 5992, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-26T17:56:39.000Z", "contentLength": 5992, "httpStatusCode": 200}	bc99f203-fbde-459f-9b43-02b28d1a1a54	\N	{}	\N	f	f
7a74661e-7cf8-454c-837c-e550ce366b88	struk-reimbursement	struk_1787767074430_3sy3e3.webp	\N	2026-08-26 17:57:55.679768+00	2026-08-26 17:57:55.679768+00	2026-08-26 17:57:55.679768+00	{"eTag": "\\"e8dc389bd886dbc5d67ff255b940ff41\\"", "size": 26108, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-26T17:57:56.000Z", "contentLength": 26108, "httpStatusCode": 200}	9a79b48c-e8c3-4cdb-ad62-ec8791c24bf4	\N	{}	\N	f	f
deb93f86-ff77-4cbb-945e-49734a276044	struk-reimbursement	struk_1787767133332_1xlrvw.webp	\N	2026-08-26 17:58:54.716476+00	2026-08-26 17:58:54.716476+00	2026-08-26 17:58:54.716476+00	{"eTag": "\\"e8dc389bd886dbc5d67ff255b940ff41\\"", "size": 26108, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-26T17:58:55.000Z", "contentLength": 26108, "httpStatusCode": 200}	ddfa531b-50d1-4703-9308-2cb04192af9e	\N	{}	\N	f	f
ac049e8e-3a29-4af8-9728-760959cb8d30	struk-reimbursement	struk_1787809376508_a73yon.webp	\N	2026-08-27 05:42:58.280274+00	2026-08-27 05:42:58.280274+00	2026-08-27 05:42:58.280274+00	{"eTag": "\\"e8dc389bd886dbc5d67ff255b940ff41\\"", "size": 26108, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-27T05:42:59.000Z", "contentLength": 26108, "httpStatusCode": 200}	b3ebd336-11e8-4d57-8cbc-55697a98fa1e	\N	{}	\N	f	f
d9ac8594-fb8d-47c8-8e6a-7b3da599925c	struk-reimbursement	struk_1787826567819_pfnxbz.webp	\N	2026-08-27 10:29:28.260994+00	2026-08-27 10:29:28.260994+00	2026-08-27 10:29:28.260994+00	{"eTag": "\\"f7b38f9215036e89a635df4cc1f4d9ad\\"", "size": 134602, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-27T10:29:29.000Z", "contentLength": 134602, "httpStatusCode": 200}	6d192dcd-571f-45fc-b548-02c7c2deeb85	\N	{}	\N	f	f
74b07f77-fc3d-4d46-b18a-ceb0744e85d5	struk-reimbursement	struk_1787826567813_uaj29l.webp	\N	2026-08-27 10:29:28.278302+00	2026-08-27 10:29:28.278302+00	2026-08-27 10:29:28.278302+00	{"eTag": "\\"e7925a2d5a626b2e805443a7a01b1800\\"", "size": 80052, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-27T10:29:29.000Z", "contentLength": 80052, "httpStatusCode": 200}	9bb0f3b0-08dc-4e52-ba36-cad6e81bb04a	\N	{}	\N	f	f
88e8f3f6-4d71-4389-92ad-81078cc5526b	struk-reimbursement	struk_1787826567919_g62mg1.webp	\N	2026-08-27 10:29:29.698116+00	2026-08-27 10:29:29.698116+00	2026-08-27 10:29:29.698116+00	{"eTag": "\\"6e25361097fe0e79a0e061b93e8a7ca9\\"", "size": 220254, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-27T10:29:30.000Z", "contentLength": 220254, "httpStatusCode": 200}	cb388b0c-3663-4563-8334-4b87ad2a2ede	\N	{}	\N	f	f
115000d5-9a49-41d3-849d-f83f78307dbc	struk-reimbursement	struk_1787842773631_xf0lnr.webp	\N	2026-08-27 14:59:33.606349+00	2026-08-27 14:59:33.606349+00	2026-08-27 14:59:33.606349+00	{"eTag": "\\"f7b38f9215036e89a635df4cc1f4d9ad\\"", "size": 134602, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-27T14:59:34.000Z", "contentLength": 134602, "httpStatusCode": 200}	033e2185-4e4b-47cd-b836-a5711e85a774	\N	{}	\N	f	f
8a7e542e-41eb-4d90-be71-0ccec011fdd9	struk-reimbursement	struk_1787849789288_4s4sqv.webp	\N	2026-08-27 16:56:30.262803+00	2026-08-27 16:56:30.262803+00	2026-08-27 16:56:30.262803+00	{"eTag": "\\"28fa53d340049849efafe8265e872d80\\"", "size": 1448, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-27T16:56:31.000Z", "contentLength": 1448, "httpStatusCode": 200}	303276c7-7de9-4bba-8c9c-5b5121aeb793	\N	{}	\N	f	f
fc0d3d07-3fdb-4d39-8e0d-f9c571a6236e	struk-reimbursement	struk_1787849975635_bijoqu.webp	\N	2026-08-27 16:59:36.181235+00	2026-08-27 16:59:36.181235+00	2026-08-27 16:59:36.181235+00	{"eTag": "\\"6be5b8c564cbaf9e6bf73a8bef95b172\\"", "size": 34108, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-27T16:59:37.000Z", "contentLength": 34108, "httpStatusCode": 200}	92f7732d-d44c-4d2b-9df4-1fe498d56c7a	\N	{}	\N	f	f
8255c970-765b-4001-8a3d-29ffa2dd4f00	struk-reimbursement	struk_1787891478559_o3ckj1.pdf	\N	2026-08-28 04:31:19.17384+00	2026-08-28 04:31:19.17384+00	2026-08-28 04:31:19.17384+00	{"eTag": "\\"51a01f31db1ed78c9e47e3fde3b382d2\\"", "size": 236307, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-08-28T04:31:20.000Z", "contentLength": 236307, "httpStatusCode": 200}	f7aa936a-43ff-4c6b-b4fa-7e8f8806c7db	\N	{}	\N	f	f
9f8a97fd-aabb-4446-9eba-7d7ad7f5ef4a	struk-reimbursement	struk_1787891478686_m2bpid.jpg	\N	2026-08-28 04:31:19.933893+00	2026-08-28 04:31:19.933893+00	2026-08-28 04:31:19.933893+00	{"eTag": "\\"d58f95444813d3af87ebff86d27ba1d9\\"", "size": 292279, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-28T04:31:20.000Z", "contentLength": 292279, "httpStatusCode": 200}	4145dca2-c54b-4784-95a0-ffd4ad32091f	\N	{}	\N	f	f
305b9ed8-64a2-4dfd-9b89-83e034a91abb	struk-reimbursement	struk_1787898738197_qmtlyh.webp	\N	2026-08-28 06:32:18.913229+00	2026-08-28 06:32:18.913229+00	2026-08-28 06:32:18.913229+00	{"eTag": "\\"28b18ba15625a1eb9c41d13155881c41\\"", "size": 31418, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-28T06:32:19.000Z", "contentLength": 31418, "httpStatusCode": 200}	8aa65291-1d1d-4553-884d-1ed8524f7fef	\N	{}	\N	f	f
d76c201f-28ef-424e-92c6-7ef5cdda8e7b	struk-reimbursement	struk_1787898738190_4z7rd3.webp	\N	2026-08-28 06:32:18.947113+00	2026-08-28 06:32:18.947113+00	2026-08-28 06:32:18.947113+00	{"eTag": "\\"84639b985ef535672914f86b16750091\\"", "size": 31194, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-28T06:32:19.000Z", "contentLength": 31194, "httpStatusCode": 200}	89b2cafb-5502-48a8-8bbf-7e8f28d98320	\N	{}	\N	f	f
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: approval_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.approval_id_seq', 112, true);


--
-- Name: audit_trail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_trail_id_seq', 1314, true);


--
-- Name: budget_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budget_id_seq', 33, true);


--
-- Name: jurnal_akuntansi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jurnal_akuntansi_id_seq', 64, true);


--
-- Name: keterangan_anggaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.keterangan_anggaran_id_seq', 29, true);


--
-- Name: main_anggaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_anggaran_id_seq', 79, true);


--
-- Name: master_main_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_main_id_seq', 33, true);


--
-- Name: master_sub_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_sub_id_seq', 66, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 253, true);


--
-- Name: pengajuan_anggaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pengajuan_anggaran_id_seq', 14, true);


--
-- Name: proyek_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proyek_id_seq', 42, true);


--
-- Name: reimbursement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reimbursement_id_seq', 79, true);


--
-- Name: sub_anggaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sub_anggaran_id_seq', 76, true);


--
-- Name: termin_pembayaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.termin_pembayaran_id_seq', 184, true);


--
-- Name: transaksi_pemasukan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transaksi_pemasukan_id_seq', 20, true);


--
-- Name: user_proyek_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_proyek_id_seq', 39, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_realtime_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: approval approval_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval
    ADD CONSTRAINT approval_pkey PRIMARY KEY (id);


--
-- Name: audit_trail audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_trail
    ADD CONSTRAINT audit_trail_pkey PRIMARY KEY (id);


--
-- Name: budget budget_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget
    ADD CONSTRAINT budget_pkey PRIMARY KEY (id);


--
-- Name: jurnal_akuntansi jurnal_akuntansi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jurnal_akuntansi
    ADD CONSTRAINT jurnal_akuntansi_pkey PRIMARY KEY (id);


--
-- Name: keterangan_anggaran keterangan_anggaran_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keterangan_anggaran
    ADD CONSTRAINT keterangan_anggaran_pkey PRIMARY KEY (id);


--
-- Name: main_anggaran main_anggaran_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_anggaran
    ADD CONSTRAINT main_anggaran_pkey PRIMARY KEY (id);


--
-- Name: master_main master_main_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_main
    ADD CONSTRAINT master_main_pkey PRIMARY KEY (id);


--
-- Name: master_sub master_sub_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_sub
    ADD CONSTRAINT master_sub_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pengajuan_anggaran pengajuan_anggaran_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_anggaran
    ADD CONSTRAINT pengajuan_anggaran_pkey PRIMARY KEY (id);


--
-- Name: proyek proyek_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyek
    ADD CONSTRAINT proyek_pkey PRIMARY KEY (id);


--
-- Name: reimbursement reimbursement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reimbursement
    ADD CONSTRAINT reimbursement_pkey PRIMARY KEY (id);


--
-- Name: sub_anggaran sub_anggaran_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_anggaran
    ADD CONSTRAINT sub_anggaran_pkey PRIMARY KEY (id);


--
-- Name: termin_pembayaran termin_pembayaran_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.termin_pembayaran
    ADD CONSTRAINT termin_pembayaran_pkey PRIMARY KEY (id);


--
-- Name: transaksi_pemasukan transaksi_pemasukan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaksi_pemasukan
    ADD CONSTRAINT transaksi_pemasukan_pkey PRIMARY KEY (id);


--
-- Name: user_proyek user_proyek_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_proyek
    ADD CONSTRAINT user_proyek_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: approval_approver_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX approval_approver_id_idx ON public.approval USING btree (approver_id);


--
-- Name: approval_level_status_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX approval_level_status_timestamp_idx ON public.approval USING btree (level, status, "timestamp");


--
-- Name: approval_reimbursement_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX approval_reimbursement_id_idx ON public.approval USING btree (reimbursement_id);


--
-- Name: audit_trail_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_trail_timestamp_idx ON public.audit_trail USING btree ("timestamp");


--
-- Name: audit_trail_user_id_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_trail_user_id_timestamp_idx ON public.audit_trail USING btree (user_id, "timestamp");


--
-- Name: budget_proyek_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX budget_proyek_id_key ON public.budget USING btree (proyek_id);


--
-- Name: jurnal_akuntansi_no_akun_debit_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jurnal_akuntansi_no_akun_debit_idx ON public.jurnal_akuntansi USING btree (no_akun_debit);


--
-- Name: jurnal_akuntansi_no_akun_kredit_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jurnal_akuntansi_no_akun_kredit_idx ON public.jurnal_akuntansi USING btree (no_akun_kredit);


--
-- Name: jurnal_akuntansi_reimbursement_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jurnal_akuntansi_reimbursement_id_idx ON public.jurnal_akuntansi USING btree (reimbursement_id);


--
-- Name: jurnal_akuntansi_transaksi_pemasukan_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jurnal_akuntansi_transaksi_pemasukan_id_idx ON public.jurnal_akuntansi USING btree (transaksi_pemasukan_id);


--
-- Name: keterangan_anggaran_sub_anggaran_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX keterangan_anggaran_sub_anggaran_id_idx ON public.keterangan_anggaran USING btree (sub_anggaran_id);


--
-- Name: main_anggaran_budget_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_anggaran_budget_id_idx ON public.main_anggaran USING btree (budget_id);


--
-- Name: main_anggaran_budget_id_tipe_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_anggaran_budget_id_tipe_idx ON public.main_anggaran USING btree (budget_id, tipe);


--
-- Name: master_main_tipe_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX master_main_tipe_idx ON public.master_main USING btree (tipe);


--
-- Name: master_sub_main_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX master_sub_main_id_idx ON public.master_sub USING btree (main_id);


--
-- Name: master_sub_tipe_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX master_sub_tipe_idx ON public.master_sub USING btree (tipe);


--
-- Name: notifications_user_id_dibaca_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_user_id_dibaca_timestamp_idx ON public.notifications USING btree (user_id, dibaca, "timestamp");


--
-- Name: pengajuan_anggaran_main_anggaran_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pengajuan_anggaran_main_anggaran_id_status_idx ON public.pengajuan_anggaran USING btree (main_anggaran_id, status);


--
-- Name: pengajuan_anggaran_proyek_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pengajuan_anggaran_proyek_id_status_idx ON public.pengajuan_anggaran USING btree (proyek_id, status);


--
-- Name: pengajuan_anggaran_status_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pengajuan_anggaran_status_created_at_idx ON public.pengajuan_anggaran USING btree (status, created_at);


--
-- Name: proyek_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX proyek_status_idx ON public.proyek USING btree (status);


--
-- Name: proyek_tanggal_mulai_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX proyek_tanggal_mulai_idx ON public.proyek USING btree (tanggal_mulai);


--
-- Name: reimbursement_keterangan_anggaran_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reimbursement_keterangan_anggaran_id_idx ON public.reimbursement USING btree (keterangan_anggaran_id);


--
-- Name: reimbursement_proyek_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reimbursement_proyek_id_idx ON public.reimbursement USING btree (proyek_id);


--
-- Name: reimbursement_status_proyek_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reimbursement_status_proyek_id_idx ON public.reimbursement USING btree (status, proyek_id);


--
-- Name: reimbursement_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reimbursement_user_id_idx ON public.reimbursement USING btree (user_id);


--
-- Name: sub_anggaran_main_anggaran_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sub_anggaran_main_anggaran_id_idx ON public.sub_anggaran USING btree (main_anggaran_id);


--
-- Name: sub_anggaran_main_anggaran_id_tipe_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sub_anggaran_main_anggaran_id_tipe_idx ON public.sub_anggaran USING btree (main_anggaran_id, tipe);


--
-- Name: termin_pembayaran_proyek_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX termin_pembayaran_proyek_id_idx ON public.termin_pembayaran USING btree (proyek_id);


--
-- Name: termin_pembayaran_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX termin_pembayaran_status_idx ON public.termin_pembayaran USING btree (status);


--
-- Name: transaksi_pemasukan_kategori_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transaksi_pemasukan_kategori_idx ON public.transaksi_pemasukan USING btree (kategori);


--
-- Name: transaksi_pemasukan_proyek_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transaksi_pemasukan_proyek_id_idx ON public.transaksi_pemasukan USING btree (proyek_id);


--
-- Name: transaksi_pemasukan_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transaksi_pemasukan_status_idx ON public.transaksi_pemasukan USING btree (status);


--
-- Name: transaksi_pemasukan_sub_coa_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transaksi_pemasukan_sub_coa_id_idx ON public.transaksi_pemasukan USING btree (sub_coa_id);


--
-- Name: user_proyek_user_id_proyek_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_proyek_user_id_proyek_id_key ON public.user_proyek USING btree (user_id, proyek_id);


--
-- Name: user_proyek_user_id_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_proyek_user_id_role_idx ON public.user_proyek USING btree (user_id, role);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: approval approval_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval
    ADD CONSTRAINT approval_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: approval approval_reimbursement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval
    ADD CONSTRAINT approval_reimbursement_id_fkey FOREIGN KEY (reimbursement_id) REFERENCES public.reimbursement(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_trail audit_trail_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_trail
    ADD CONSTRAINT audit_trail_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: budget budget_proyek_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget
    ADD CONSTRAINT budget_proyek_id_fkey FOREIGN KEY (proyek_id) REFERENCES public.proyek(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jurnal_akuntansi jurnal_akuntansi_reimbursement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jurnal_akuntansi
    ADD CONSTRAINT jurnal_akuntansi_reimbursement_id_fkey FOREIGN KEY (reimbursement_id) REFERENCES public.reimbursement(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jurnal_akuntansi jurnal_akuntansi_transaksi_pemasukan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jurnal_akuntansi
    ADD CONSTRAINT jurnal_akuntansi_transaksi_pemasukan_id_fkey FOREIGN KEY (transaksi_pemasukan_id) REFERENCES public.transaksi_pemasukan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: keterangan_anggaran keterangan_anggaran_sub_anggaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.keterangan_anggaran
    ADD CONSTRAINT keterangan_anggaran_sub_anggaran_id_fkey FOREIGN KEY (sub_anggaran_id) REFERENCES public.sub_anggaran(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: main_anggaran main_anggaran_budget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_anggaran
    ADD CONSTRAINT main_anggaran_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budget(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: master_sub master_sub_main_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_sub
    ADD CONSTRAINT master_sub_main_id_fkey FOREIGN KEY (main_id) REFERENCES public.master_main(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pengajuan_anggaran pengajuan_anggaran_main_anggaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_anggaran
    ADD CONSTRAINT pengajuan_anggaran_main_anggaran_id_fkey FOREIGN KEY (main_anggaran_id) REFERENCES public.main_anggaran(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pengajuan_anggaran pengajuan_anggaran_pengaju_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_anggaran
    ADD CONSTRAINT pengajuan_anggaran_pengaju_id_fkey FOREIGN KEY (pengaju_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pengajuan_anggaran pengajuan_anggaran_proyek_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_anggaran
    ADD CONSTRAINT pengajuan_anggaran_proyek_id_fkey FOREIGN KEY (proyek_id) REFERENCES public.proyek(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reimbursement reimbursement_keterangan_anggaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reimbursement
    ADD CONSTRAINT reimbursement_keterangan_anggaran_id_fkey FOREIGN KEY (keterangan_anggaran_id) REFERENCES public.keterangan_anggaran(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reimbursement reimbursement_proyek_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reimbursement
    ADD CONSTRAINT reimbursement_proyek_id_fkey FOREIGN KEY (proyek_id) REFERENCES public.proyek(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reimbursement reimbursement_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reimbursement
    ADD CONSTRAINT reimbursement_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sub_anggaran sub_anggaran_main_anggaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_anggaran
    ADD CONSTRAINT sub_anggaran_main_anggaran_id_fkey FOREIGN KEY (main_anggaran_id) REFERENCES public.main_anggaran(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: termin_pembayaran termin_pembayaran_proyek_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.termin_pembayaran
    ADD CONSTRAINT termin_pembayaran_proyek_id_fkey FOREIGN KEY (proyek_id) REFERENCES public.proyek(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transaksi_pemasukan transaksi_pemasukan_proyek_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaksi_pemasukan
    ADD CONSTRAINT transaksi_pemasukan_proyek_id_fkey FOREIGN KEY (proyek_id) REFERENCES public.proyek(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transaksi_pemasukan transaksi_pemasukan_sub_coa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaksi_pemasukan
    ADD CONSTRAINT transaksi_pemasukan_sub_coa_id_fkey FOREIGN KEY (sub_coa_id) REFERENCES public.master_sub(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transaksi_pemasukan transaksi_pemasukan_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaksi_pemasukan
    ADD CONSTRAINT transaksi_pemasukan_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_proyek user_proyek_proyek_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_proyek
    ADD CONSTRAINT user_proyek_proyek_id_fkey FOREIGN KEY (proyek_id) REFERENCES public.proyek(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_proyek user_proyek_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_proyek
    ADD CONSTRAINT user_proyek_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin WITH GRANT OPTION;
GRANT USAGE ON SCHEMA realtime TO authenticated;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO service_role;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION send_binary(payload bytea, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION wal2json_escape_identifier(name text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO postgres;
GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE webauthn_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_challenges TO postgres;
GRANT ALL ON TABLE auth.webauthn_challenges TO dashboard_user;


--
-- Name: TABLE webauthn_credentials; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_credentials TO postgres;
GRANT ALL ON TABLE auth.webauthn_credentials TO dashboard_user;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE approval; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.approval TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.approval TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.approval TO service_role;


--
-- Name: TABLE audit_trail; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.audit_trail TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.audit_trail TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.audit_trail TO service_role;


--
-- Name: TABLE budget; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.budget TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.budget TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.budget TO service_role;


--
-- Name: TABLE jurnal_akuntansi; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.jurnal_akuntansi TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.jurnal_akuntansi TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.jurnal_akuntansi TO service_role;


--
-- Name: TABLE keterangan_anggaran; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.keterangan_anggaran TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.keterangan_anggaran TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.keterangan_anggaran TO service_role;


--
-- Name: TABLE main_anggaran; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.main_anggaran TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.main_anggaran TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.main_anggaran TO service_role;


--
-- Name: TABLE master_main; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.master_main TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.master_main TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.master_main TO service_role;


--
-- Name: TABLE master_sub; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.master_sub TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.master_sub TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.master_sub TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.notifications TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.notifications TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.notifications TO service_role;


--
-- Name: TABLE pengajuan_anggaran; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.pengajuan_anggaran TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.pengajuan_anggaran TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.pengajuan_anggaran TO service_role;


--
-- Name: TABLE proyek; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.proyek TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.proyek TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.proyek TO service_role;


--
-- Name: TABLE reimbursement; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.reimbursement TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.reimbursement TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.reimbursement TO service_role;


--
-- Name: TABLE sub_anggaran; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.sub_anggaran TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.sub_anggaran TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.sub_anggaran TO service_role;


--
-- Name: TABLE termin_pembayaran; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.termin_pembayaran TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.termin_pembayaran TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.termin_pembayaran TO service_role;


--
-- Name: TABLE transaksi_pemasukan; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.transaksi_pemasukan TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.transaksi_pemasukan TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.transaksi_pemasukan TO service_role;


--
-- Name: TABLE user_proyek; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.user_proyek TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.user_proyek TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.user_proyek TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.users TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.users TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.users TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict fWl5hjqzMJGNrZ8ypvypvhkrlyvPOX1UMnfhbAFFpcbgfoSjJu2xbwiW3tpt0LA

