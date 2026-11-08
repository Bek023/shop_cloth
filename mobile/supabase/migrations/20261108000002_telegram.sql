-- Server-side helpers for the Telegram bot and the daily reminder job.
-- Callable only with the service role key (Edge Functions), never by app users.

-- Links a Telegram chat using a one-time token. Atomic: a token works once.
create function public.consume_link_token(p_token text, p_chat_id bigint)
returns table (status text, kind text, shop_name text, contact_name text)
language plpgsql security definer set search_path = '' as $$
declare
  t public.link_tokens;
begin
  select * into t from public.link_tokens where token = p_token for update;
  if not found then return query select 'invalid', null::text, null::text, null::text; return; end if;
  if t.used_at is not null then return query select 'used', t.kind, null::text, null::text; return; end if;
  if t.expires_at < now() then return query select 'expired', t.kind, null::text, null::text; return; end if;

  update public.link_tokens set used_at = now() where token = p_token;

  if t.kind = 'contact' then
    insert into public.telegram_links (contact_id, chat_id) values (t.contact_id, p_chat_id)
      on conflict (contact_id) do update set chat_id = excluded.chat_id, linked_at = now();
  else
    insert into public.owner_chats (user_id, shop_id, chat_id) values (t.user_id, t.shop_id, p_chat_id)
      on conflict (user_id, shop_id) do update set chat_id = excluded.chat_id, linked_at = now();
  end if;

  return query
    select 'ok', t.kind, s.name, c.name
    from public.shops s left join public.contacts c on c.id = t.contact_id
    where s.id = t.shop_id;
end $$;

-- What a customer sees when they ask the bot for their balance.
create function public.balances_for_chat(p_chat_id bigint)
returns table (shop_name text, contact_name text, balance bigint, next_due date)
language sql stable security definer set search_path = '' as $$
  select s.name, c.name, b.balance, b.next_due
  from public.telegram_links l
  join public.contacts c on c.id = l.contact_id and c.deleted_at is null
  join public.shops s on s.id = c.shop_id
  join public.contact_balances b on b.contact_id = c.id
  where l.chat_id = p_chat_id
  order by s.name, c.name;
$$;

create function public.unlink_chat(p_chat_id bigint)
returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  delete from public.telegram_links where chat_id = p_chat_id;
  get diagnostics n = row_count;
  return n;
end $$;

-- Linked customers who owe money and have a due date, in shops with auto reminders on.
create function public.reminder_candidates()
returns table (contact_id uuid, shop_id uuid, chat_id bigint, shop_name text, contact_name text, balance bigint, next_due date)
language sql stable security definer set search_path = '' as $$
  select c.id, s.id, l.chat_id, s.name, c.name, b.balance, b.next_due
  from public.telegram_links l
  join public.contacts c on c.id = l.contact_id and c.deleted_at is null and c.kind = 'customer'
  join public.shops s on s.id = c.shop_id and s.auto_reminders
  join public.contact_balances b on b.contact_id = c.id
  where b.balance > 0 and b.next_due is not null;
$$;

-- Debts due today or overdue, per linked owner chat, for the morning digest.
create function public.owner_digest_items(p_today date)
returns table (chat_id bigint, shop_id uuid, shop_name text, contact_name text, balance bigint, next_due date)
language sql stable security definer set search_path = '' as $$
  select o.chat_id, s.id, s.name, c.name, b.balance, b.next_due
  from public.owner_chats o
  join public.shops s on s.id = o.shop_id
  join public.contacts c on c.shop_id = s.id and c.deleted_at is null
  join public.contact_balances b on b.contact_id = c.id
  where b.balance > 0 and b.next_due is not null and b.next_due <= p_today
  order by o.chat_id, b.next_due, c.name;
$$;

-- Claims a reminder slot. Returns the id, or null if this reminder was already handled.
create function public.claim_reminder(p_shop uuid, p_contact uuid, p_chat bigint, p_kind text, p_period text)
returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  insert into public.reminders (shop_id, contact_id, chat_id, kind, period_key)
    values (p_shop, p_contact, p_chat, p_kind, p_period)
    returning id into v_id;
  return v_id;
exception when unique_violation then
  return null;
end $$;

create function public.finish_reminder(p_id bigint, p_ok boolean, p_error text default null)
returns void
language sql security definer set search_path = '' as $$
  update public.reminders set status = case when p_ok then 'sent' else 'failed' end, error = left(p_error, 500)
  where id = p_id;
$$;

-- Records a Telegram update id. Returns false if it was already processed (Telegram retries).
create function public.mark_telegram_update(p_update_id bigint)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.telegram_updates (update_id) values (p_update_id);
  return true;
exception when unique_violation then
  return false;
end $$;

-- The unique key treats NULL contact ids as distinct; owner digests need one row per chat per day.
create unique index reminders_owner_digest_once on public.reminders (chat_id, kind, period_key) where contact_id is null;

do $$
declare f text;
begin
  foreach f in array array[
    'consume_link_token(text, bigint)', 'balances_for_chat(bigint)', 'unlink_chat(bigint)',
    'reminder_candidates()', 'owner_digest_items(date)',
    'claim_reminder(uuid, uuid, bigint, text, text)', 'finish_reminder(bigint, boolean, text)',
    'mark_telegram_update(bigint)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
