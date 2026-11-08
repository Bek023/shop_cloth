// BotRepo backed by the service-role Postgres functions in migrations/20261108000002_telegram.sql.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { BotRepo, Candidate, ConsumeResult, DigestItem } from './bot.ts';
import type { BalanceRow } from './logic.ts';

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function rpc<T>(db: SupabaseClient, fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

export function supabaseRepo(db: SupabaseClient): BotRepo {
  return {
    markUpdate: (id) => rpc<boolean>(db, 'mark_telegram_update', { p_update_id: id }),
    consumeToken: async (token, chatId) =>
      (await rpc<ConsumeResult[]>(db, 'consume_link_token', { p_token: token, p_chat_id: chatId }))[0],
    balancesForChat: (chatId) => rpc<BalanceRow[]>(db, 'balances_for_chat', { p_chat_id: chatId }),
    unlinkChat: (chatId) => rpc<number>(db, 'unlink_chat', { p_chat_id: chatId }),
    reminderCandidates: () => rpc<Candidate[]>(db, 'reminder_candidates'),
    ownerDigestItems: (today) => rpc<DigestItem[]>(db, 'owner_digest_items', { p_today: today }),
    claimReminder: (shopId, contactId, chatId, kind, period) =>
      rpc<number | null>(db, 'claim_reminder', { p_shop: shopId, p_contact: contactId, p_chat: chatId, p_kind: kind, p_period: period }),
    finishReminder: async (id, ok, error) => {
      await rpc(db, 'finish_reminder', { p_id: id, p_ok: ok, p_error: error ?? null });
    },
  };
}

/** Telegram Bot API sendMessage. Throws on any non-OK answer so the caller can record it. */
export function telegramSender(token: string) {
  return async (chatId: number, text: string) => {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Telegram ${res.status}: ${(body as { description?: string }).description ?? 'error'}`);
    }
  };
}

export function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} must be set`);
  return v;
}
