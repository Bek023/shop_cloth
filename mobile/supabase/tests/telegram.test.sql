-- Telegram helper tests. Runs after rls.test.sql on the same database, with its own users.
\set ON_ERROR_STOP 1

insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000c'), ('00000000-0000-0000-0000-00000000000d');

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c"}', false);

do $$
declare s public.shops; t_contact text; t_owner text;
begin
  s := public.bootstrap_shop('Nur market');
  perform set_config('test.shop', s.id::text, false);
  insert into public.contacts (id, shop_id, kind, name, created_at, updated_at) values
    ('33333333-3333-3333-3333-333333333331', s.id, 'customer', 'Laylo', now(), now()),
    ('33333333-3333-3333-3333-333333333332', s.id, 'customer', 'Bobur', now(), now());
  insert into public.transactions (id, shop_id, contact_id, type, amount, occurred_at, due_date, created_at, updated_at) values
    (gen_random_uuid(), s.id, '33333333-3333-3333-3333-333333333331', 'gave', 120000, now(), current_date, now(), now()),
    (gen_random_uuid(), s.id, '33333333-3333-3333-3333-333333333332', 'gave', 50000, now(), current_date + 10, now(), now());
  t_contact := public.create_link_token(s.id, '33333333-3333-3333-3333-333333333331');
  t_owner := public.create_link_token(s.id, null);
  perform set_config('test.t_contact', t_contact, false);
  perform set_config('test.t_owner', t_owner, false);
end $$;

-- App users cannot call server helpers.
do $$ begin
  begin
    perform public.consume_link_token(current_setting('test.t_contact'), 1);
    raise exception 'authenticated called consume_link_token';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.reminder_candidates();
    raise exception 'authenticated called reminder_candidates';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------------------------------------------------------------- server side
reset role;
set role service_role;

do $$
declare r record;
begin
  select * into r from public.consume_link_token(current_setting('test.t_contact'), 7001);
  if r.status <> 'ok' or r.kind <> 'contact' or r.contact_name <> 'Laylo' or r.shop_name <> 'Nur market' then
    raise exception 'consume contact token: %', row_to_json(r);
  end if;
  select * into r from public.consume_link_token(current_setting('test.t_contact'), 7002);
  if r.status <> 'used' then raise exception 'token reuse must fail, got %', r.status; end if;
  select * into r from public.consume_link_token('nope', 7002);
  if r.status <> 'invalid' then raise exception 'unknown token must be invalid'; end if;

  select * into r from public.consume_link_token(current_setting('test.t_owner'), 9001);
  if r.status <> 'ok' or r.kind <> 'owner' then raise exception 'consume owner token: %', row_to_json(r); end if;

  update public.link_tokens set expires_at = now() - interval '1 minute', used_at = null where token = current_setting('test.t_owner');
  select * into r from public.consume_link_token(current_setting('test.t_owner'), 9001);
  if r.status <> 'expired' then raise exception 'expired token must fail, got %', r.status; end if;
end $$;

do $$
declare n int; b bigint;
begin
  select count(*), max(balance) into n, b from public.balances_for_chat(7001);
  if n <> 1 or b <> 120000 then raise exception 'balances_for_chat: % rows, balance %', n, b; end if;

  -- Only linked contacts with debt and a due date are candidates.
  select count(*) into n from public.reminder_candidates() where shop_id = current_setting('test.shop')::uuid;
  if n <> 1 then raise exception 'reminder_candidates: expected 1, got %', n; end if;

  select count(*) into n from public.owner_digest_items(current_date) where chat_id = 9001;
  if n <> 1 then raise exception 'owner_digest_items: expected 1 (due today), got %', n; end if;
end $$;

-- Reminders are claimed once per chat, kind and day, for customers and owner digests alike.
do $$
declare a bigint; b bigint;
begin
  a := public.claim_reminder(current_setting('test.shop')::uuid, '33333333-3333-3333-3333-333333333331', 7001, 'due_today', '2026-11-08');
  b := public.claim_reminder(current_setting('test.shop')::uuid, '33333333-3333-3333-3333-333333333331', 7001, 'due_today', '2026-11-08');
  if a is null or b is not null then raise exception 'claim_reminder not idempotent: % %', a, b; end if;
  perform public.finish_reminder(a, true);
  if (select status from public.reminders where id = a) <> 'sent' then raise exception 'finish_reminder'; end if;

  a := public.claim_reminder(current_setting('test.shop')::uuid, null, 9001, 'owner_digest', '2026-11-08');
  b := public.claim_reminder(current_setting('test.shop')::uuid, null, 9001, 'owner_digest', '2026-11-08');
  if a is null or b is not null then raise exception 'owner digest claim not idempotent: % %', a, b; end if;
end $$;

do $$ begin
  if not public.mark_telegram_update(555) then raise exception 'first update must be new'; end if;
  if public.mark_telegram_update(555) then raise exception 'repeated update must be rejected'; end if;
  if public.unlink_chat(7001) <> 1 then raise exception 'unlink_chat'; end if;
  if exists (select 1 from public.balances_for_chat(7001)) then raise exception 'unlinked chat still sees balances'; end if;
end $$;

-- Auto reminders off: no candidates.
update public.shops set auto_reminders = false where id = current_setting('test.shop')::uuid;
do $$ begin
  if exists (select 1 from public.reminder_candidates() where shop_id = current_setting('test.shop')::uuid) then
    raise exception 'auto_reminders=false must stop reminders';
  end if;
end $$;

-- ---------------------------------------------------------------- other users see no link data
reset role;
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d"}', false);
do $$ begin
  if exists (select 1 from public.telegram_links) then raise exception 'D sees C''s telegram links'; end if;
end $$;
reset role;

\echo 'telegram.test.sql: all checks passed'
