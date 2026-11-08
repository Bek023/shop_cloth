-- Access-rule and sync tests. Run with supabase/tests/run.sh.
-- Each block raises an exception (and stops psql) on failure.
\set ON_ERROR_STOP 1

insert into auth.users (id, phone) values
  ('00000000-0000-0000-0000-00000000000a', '998901111111'),
  ('00000000-0000-0000-0000-00000000000b', '998902222222');

create function pg_temp.as_user(p uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, false);
$$;

-- ---------------------------------------------------------------- user A builds a shop
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');

do $$
declare s public.shops; s2 public.shops;
begin
  s := public.bootstrap_shop('Baraka savdo', 'Akmal');
  s2 := public.bootstrap_shop('Ikkinchi', null);
  if s.id <> s2.id then raise exception 'bootstrap_shop must return the existing shop'; end if;
  perform set_config('test.shop_a', s.id::text, false);
end $$;

insert into public.contacts (id, shop_id, kind, name, phone, created_at, updated_at)
values ('11111111-1111-1111-1111-111111111111', current_setting('test.shop_a')::uuid, 'customer', 'Aziz', '931112233',
        '2026-11-01T10:00:00Z', '2026-11-01T10:00:00Z');

insert into public.transactions (id, shop_id, contact_id, type, amount, occurred_at, due_date, created_at, updated_at)
values
  ('22222222-2222-2222-2222-222222222221', current_setting('test.shop_a')::uuid, '11111111-1111-1111-1111-111111111111',
   'gave', 500000, '2026-11-01T10:00:00Z', '2026-11-08', '2026-11-01T10:00:00Z', '2026-11-01T10:00:00Z'),
  ('22222222-2222-2222-2222-222222222222', current_setting('test.shop_a')::uuid, '11111111-1111-1111-1111-111111111111',
   'got', 200000, '2026-11-02T10:00:00Z', null, '2026-11-02T10:00:00Z', '2026-11-02T10:00:00Z');

do $$
declare b bigint; d date;
begin
  select balance, next_due into b, d from public.contact_balances where contact_id = '11111111-1111-1111-1111-111111111111';
  if b <> 300000 then raise exception 'balance: expected 300000, got %', b; end if;
  if d <> '2026-11-08' then raise exception 'next_due: expected 2026-11-08, got %', d; end if;
end $$;

-- ---------------------------------------------------------------- last write wins
-- Older update is ignored, newer update applies.
update public.contacts set name = 'Eski nom', updated_at = '2026-10-01T00:00:00Z'
  where id = '11111111-1111-1111-1111-111111111111';
do $$ begin
  if (select name from public.contacts where id = '11111111-1111-1111-1111-111111111111') <> 'Aziz' then
    raise exception 'an older write must not overwrite a newer one';
  end if;
end $$;

insert into public.contacts (id, shop_id, kind, name, created_at, updated_at)
values ('11111111-1111-1111-1111-111111111111', current_setting('test.shop_a')::uuid, 'customer', 'Aziz Karimov',
        '2026-11-01T10:00:00Z', '2026-11-03T10:00:00Z')
on conflict (id) do update set name = excluded.name, updated_at = excluded.updated_at;
do $$ begin
  if (select name from public.contacts where id = '11111111-1111-1111-1111-111111111111') <> 'Aziz Karimov' then
    raise exception 'a newer upsert must apply';
  end if;
end $$;

-- Soft delete of a transaction drops it from the balance.
update public.transactions set deleted_at = now(), updated_at = '2026-11-04T00:00:00Z'
  where id = '22222222-2222-2222-2222-222222222222';
do $$ begin
  if (select balance from public.contact_balances where contact_id = '11111111-1111-1111-1111-111111111111') <> 500000 then
    raise exception 'deleted transactions must not count';
  end if;
end $$;

-- Validation: amount must be positive, got cannot carry a due date.
do $$ begin
  begin
    insert into public.transactions (id, shop_id, contact_id, type, amount, occurred_at, created_at, updated_at)
    values (gen_random_uuid(), current_setting('test.shop_a')::uuid, '11111111-1111-1111-1111-111111111111', 'gave', 0, now(), now(), now());
    raise exception 'zero amount was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.transactions (id, shop_id, contact_id, type, amount, occurred_at, due_date, created_at, updated_at)
    values (gen_random_uuid(), current_setting('test.shop_a')::uuid, '11111111-1111-1111-1111-111111111111', 'got', 5, now(), '2026-12-01', now(), now());
    raise exception 'got with due date was accepted';
  exception when check_violation then null;
  end;
end $$;

-- Owner can create link tokens.
do $$ declare t text; begin
  t := public.create_link_token(current_setting('test.shop_a')::uuid, '11111111-1111-1111-1111-111111111111');
  if length(t) <> 24 then raise exception 'token length %', length(t); end if;
  t := public.create_link_token(current_setting('test.shop_a')::uuid, null);
end $$;

-- Clients cannot read server-only tables.
do $$ begin
  begin
    perform 1 from public.link_tokens;
    raise exception 'link_tokens is readable by clients';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------------------------------------------------------------- user B sees nothing of A
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');

do $$ begin
  if exists (select 1 from public.shops) then raise exception 'B can see A''s shop'; end if;
  if exists (select 1 from public.contacts) then raise exception 'B can see A''s contacts'; end if;
  if exists (select 1 from public.transactions) then raise exception 'B can see A''s transactions'; end if;
  if exists (select 1 from public.contact_balances) then raise exception 'B can see A''s balances'; end if;
  if exists (select 1 from public.shop_members) then raise exception 'B can see A''s members'; end if;
end $$;

-- B cannot write into A's shop, directly or by reusing A's ids.
do $$ begin
  begin
    insert into public.contacts (id, shop_id, kind, name, created_at, updated_at)
    values (gen_random_uuid(), current_setting('test.shop_a')::uuid, 'customer', 'Hacker', now(), now());
    raise exception 'B inserted into A''s shop';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.contacts (id, shop_id, kind, name, created_at, updated_at)
    values ('11111111-1111-1111-1111-111111111111', current_setting('test.shop_a')::uuid, 'customer', 'Hacker', now(), '2030-01-01')
    on conflict (id) do update set name = excluded.name, updated_at = excluded.updated_at;
    raise exception 'B upserted over A''s contact';
  exception when insufficient_privilege then null;
  end;
  update public.contacts set name = 'Hacker', updated_at = '2030-01-01';
  begin
    perform public.create_link_token(current_setting('test.shop_a')::uuid, '11111111-1111-1111-1111-111111111111');
    raise exception 'B created a link token for A''s contact';
  exception when raise_exception then
    if sqlerrm not like 'not a member%' then raise; end if;
  end;
end $$;

-- B's own shop, then a transaction pointing at A's contact must fail.
do $$ declare s public.shops; begin
  s := public.bootstrap_shop('Vali do''koni');
  begin
    insert into public.transactions (id, shop_id, contact_id, type, amount, occurred_at, created_at, updated_at)
    values (gen_random_uuid(), s.id, '11111111-1111-1111-1111-111111111111', 'gave', 1000, now(), now(), now());
    raise exception 'B attached a transaction to A''s contact';
  exception when raise_exception then
    if sqlerrm not like 'contact % is not in shop %' then raise; end if;
  end;
end $$;

-- ---------------------------------------------------------------- anon gets nothing
reset role;
set role anon;
select set_config('request.jwt.claims', '', false);
do $$ begin
  if exists (select 1 from public.contacts) then raise exception 'anon can read contacts'; end if;
  begin
    perform public.bootstrap_shop('x y');
    raise exception 'anon called bootstrap_shop';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------------------------------------------------------------- account deletion
reset role;
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select public.delete_my_account();
reset role;
do $$ begin
  if exists (select 1 from auth.users where id = '00000000-0000-0000-0000-00000000000a') then raise exception 'user not deleted'; end if;
  if exists (select 1 from public.contacts where id = '11111111-1111-1111-1111-111111111111') then raise exception 'shop data not deleted'; end if;
  if (select count(*) from public.shops) <> 1 then raise exception 'other users'' shops must stay'; end if;
end $$;

\echo 'rls.test.sql: all checks passed'
