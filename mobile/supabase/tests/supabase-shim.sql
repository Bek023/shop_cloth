-- Minimal stand-in for what a Supabase project already has, so migrations and
-- access rules can be tested on plain Postgres. Never run this on Supabase.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema extensions;
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public, extensions to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key,
  phone text,
  created_at timestamptz not null default now()
);

create function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$$;

-- Supabase grants table access to API roles by default and relies on RLS.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
