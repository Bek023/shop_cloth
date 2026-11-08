-- Nasiyachi: core schema, access rules and RPCs.
-- Every table has row level security. Clients only reach rows of shops they belong to.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- tables

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  owner_name text check (owner_name is null or char_length(owner_name) <= 60),
  auto_reminders boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shop_members (
  shop_id uuid not null references public.shops (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'seller')),
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);
create index shop_members_user_idx on public.shop_members (user_id);

create table public.contacts (
  id uuid primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  kind text not null check (kind in ('customer', 'supplier')),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  phone text check (phone is null or phone ~ '^[0-9]{9}$'),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);
create index contacts_shop_sync_idx on public.contacts (shop_id, server_updated_at);

create table public.transactions (
  id uuid primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  type text not null check (type in ('gave', 'got')),
  amount bigint not null check (amount > 0 and amount <= 1000000000000),
  note text check (note is null or char_length(note) <= 200),
  occurred_at timestamptz not null,
  due_date date,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now(),
  check (type = 'gave' or due_date is null)
);
create index transactions_shop_sync_idx on public.transactions (shop_id, server_updated_at);
create index transactions_contact_idx on public.transactions (contact_id) where deleted_at is null;

-- Telegram: server-only tables (no client policies).
create table public.link_tokens (
  token text primary key,
  kind text not null check (kind in ('contact', 'owner')),
  shop_id uuid not null references public.shops (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz,
  check ((kind = 'contact') = (contact_id is not null))
);
create index link_tokens_shop_created_idx on public.link_tokens (shop_id, created_at);

create table public.telegram_links (
  contact_id uuid primary key references public.contacts (id) on delete cascade,
  chat_id bigint not null,
  linked_at timestamptz not null default now()
);
create index telegram_links_chat_idx on public.telegram_links (chat_id);

create table public.owner_chats (
  user_id uuid not null references auth.users (id) on delete cascade,
  shop_id uuid not null references public.shops (id) on delete cascade,
  chat_id bigint not null,
  linked_at timestamptz not null default now(),
  primary key (user_id, shop_id)
);

create table public.reminders (
  id bigint generated always as identity primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete cascade,
  chat_id bigint not null,
  kind text not null check (kind in ('due_soon', 'due_today', 'overdue', 'owner_digest')),
  period_key text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  unique (chat_id, kind, period_key, contact_id)
);

create table public.telegram_updates (
  update_id bigint primary key,
  received_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- sync triggers

-- Last write wins: an update carrying an older updated_at than the stored row is skipped.
-- server_updated_at is always the server's clock, so pull cursors never miss a row.
create function public.sync_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if new.updated_at < old.updated_at then
      return null;
    end if;
    if new.shop_id <> old.shop_id or new.id <> old.id then
      raise exception 'shop_id and id cannot change';
    end if;
  end if;
  new.server_updated_at := clock_timestamp();
  return new;
end $$;

create trigger contacts_sync_guard before insert or update on public.contacts
  for each row execute function public.sync_guard();
create trigger transactions_sync_guard before insert or update on public.transactions
  for each row execute function public.sync_guard();

-- A transaction must belong to a contact of the same shop.
create function public.tx_contact_same_shop() returns trigger
language plpgsql as $$
begin
  if not exists (select 1 from public.contacts c where c.id = new.contact_id and c.shop_id = new.shop_id) then
    raise exception 'contact % is not in shop %', new.contact_id, new.shop_id;
  end if;
  return new;
end $$;

create trigger transactions_contact_shop before insert or update of contact_id, shop_id on public.transactions
  for each row execute function public.tx_contact_same_shop();

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger shops_touch before update on public.shops
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- access rules

create function public.is_shop_member(p_shop uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.shop_members m
    where m.shop_id = p_shop and m.user_id = (select auth.uid())
  );
$$;

create function public.is_shop_owner(p_shop uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.shop_members m
    where m.shop_id = p_shop and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.contacts enable row level security;
alter table public.transactions enable row level security;
alter table public.link_tokens enable row level security;
alter table public.telegram_links enable row level security;
alter table public.owner_chats enable row level security;
alter table public.reminders enable row level security;
alter table public.telegram_updates enable row level security;

-- Shops are created only through bootstrap_shop().
create policy shops_select on public.shops for select to authenticated
  using (public.is_shop_member(id));
create policy shops_update on public.shops for update to authenticated
  using (public.is_shop_owner(id)) with check (public.is_shop_owner(id));

create policy members_select on public.shop_members for select to authenticated
  using (public.is_shop_member(shop_id));

create policy contacts_select on public.contacts for select to authenticated
  using (public.is_shop_member(shop_id));
create policy contacts_insert on public.contacts for insert to authenticated
  with check (public.is_shop_member(shop_id));
create policy contacts_update on public.contacts for update to authenticated
  using (public.is_shop_member(shop_id)) with check (public.is_shop_member(shop_id));

create policy tx_select on public.transactions for select to authenticated
  using (public.is_shop_member(shop_id));
create policy tx_insert on public.transactions for insert to authenticated
  with check (public.is_shop_member(shop_id));
create policy tx_update on public.transactions for update to authenticated
  using (public.is_shop_member(shop_id)) with check (public.is_shop_member(shop_id));

-- No delete policies: clients soft-delete with deleted_at so other devices learn about it.

-- Clients may see whether a contact is linked to Telegram (not the chat id).
create policy telegram_links_select on public.telegram_links for select to authenticated
  using (exists (select 1 from public.contacts c where c.id = contact_id and public.is_shop_member(c.shop_id)));

revoke all on public.link_tokens, public.owner_chats, public.reminders, public.telegram_updates from anon, authenticated;
revoke all on public.telegram_links from anon, authenticated;
grant select (contact_id, linked_at) on public.telegram_links to authenticated;

-- ---------------------------------------------------------------- balances

create view public.contact_balances with (security_invoker = true) as
select
  c.id as contact_id,
  c.shop_id,
  coalesce(sum(case when t.type = 'gave' then t.amount else -t.amount end), 0)::bigint as balance,
  min(t.due_date) filter (where t.type = 'gave') as next_due
from public.contacts c
left join public.transactions t on t.contact_id = c.id and t.deleted_at is null
where c.deleted_at is null
group by c.id, c.shop_id;

-- ---------------------------------------------------------------- RPCs

-- First sign-in: create the user's shop and make them its owner. Returns the existing shop if any.
create function public.bootstrap_shop(p_name text, p_owner_name text default null)
returns public.shops
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_shop public.shops;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select s.* into v_shop from public.shops s
    join public.shop_members m on m.shop_id = s.id
    where m.user_id = v_uid order by m.created_at limit 1;
  if found then return v_shop; end if;
  insert into public.shops (name, owner_name) values (btrim(p_name), nullif(btrim(p_owner_name), ''))
    returning * into v_shop;
  insert into public.shop_members (shop_id, user_id, role) values (v_shop.id, v_uid, 'owner');
  return v_shop;
end $$;

-- A one-time Telegram deep-link token. kind 'contact' links a customer, 'owner' links the shop owner.
create function public.create_link_token(p_shop uuid, p_contact uuid default null)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_token text;
begin
  if not public.is_shop_member(p_shop) then raise exception 'not a member of this shop'; end if;
  if p_contact is not null and not exists (
    select 1 from public.contacts c where c.id = p_contact and c.shop_id = p_shop and c.deleted_at is null
  ) then
    raise exception 'contact not found';
  end if;
  if p_contact is null and not public.is_shop_owner(p_shop) then
    raise exception 'only the owner can link the owner chat';
  end if;
  -- Rate limit: 50 tokens per shop per hour.
  if (select count(*) from public.link_tokens t where t.shop_id = p_shop and t.created_at > now() - interval '1 hour') >= 50 then
    raise exception 'too many link requests, try again later';
  end if;
  v_token := encode(extensions.gen_random_bytes(12), 'hex');
  insert into public.link_tokens (token, kind, shop_id, contact_id, user_id)
    values (v_token, case when p_contact is null then 'owner' else 'contact' end, p_shop, p_contact, v_uid);
  return v_token;
end $$;

-- Deletes the signed-in user, every shop they own (with all its data) and their memberships.
create function public.delete_my_account()
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  delete from public.shops s where exists (
    select 1 from public.shop_members m where m.shop_id = s.id and m.user_id = v_uid and m.role = 'owner'
  );
  delete from auth.users where id = v_uid;
end $$;

revoke all on function public.bootstrap_shop(text, text) from public, anon;
revoke all on function public.create_link_token(uuid, uuid) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.bootstrap_shop(text, text) to authenticated;
grant execute on function public.create_link_token(uuid, uuid) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
