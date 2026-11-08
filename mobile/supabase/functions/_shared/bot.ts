// Telegram bot and reminder job, written against small interfaces so they can be tested without
// Telegram or a database. index.ts files wire them to Supabase and the Bot API.
import {
  balancesText,
  ownerDigestText,
  parseCommand,
  reminderKind,
  reminderText,
  tashkentToday,
  type BalanceRow,
} from './logic.ts';

export type ConsumeResult = { status: 'ok' | 'used' | 'expired' | 'invalid'; kind: 'contact' | 'owner' | null; shop_name: string | null; contact_name: string | null };

export type Candidate = { contact_id: string; shop_id: string; chat_id: number; shop_name: string; contact_name: string; balance: number; next_due: string };
export type DigestItem = { chat_id: number; shop_id: string; shop_name: string; contact_name: string; balance: number; next_due: string };

export interface BotRepo {
  markUpdate(updateId: number): Promise<boolean>;
  consumeToken(token: string, chatId: number): Promise<ConsumeResult>;
  balancesForChat(chatId: number): Promise<BalanceRow[]>;
  unlinkChat(chatId: number): Promise<number>;
  reminderCandidates(): Promise<Candidate[]>;
  ownerDigestItems(today: string): Promise<DigestItem[]>;
  claimReminder(shopId: string, contactId: string | null, chatId: number, kind: string, period: string): Promise<number | null>;
  finishReminder(id: number, ok: boolean, error?: string): Promise<void>;
}

export type Send = (chatId: number, text: string) => Promise<void>;

type TgUpdate = {
  update_id: number;
  message?: { chat: { id: number; type: string }; text?: string };
};

const HELP =
  'Bu bot do‘kondagi qarzingiz haqida eslatib turadi.\n\n/qarzim — qarzingizni ko‘rish\n/stop — eslatmalarni to‘xtatish';

export async function handleUpdate(update: TgUpdate, deps: { db: BotRepo; send: Send }): Promise<void> {
  const { db, send } = deps;
  if (!(await db.markUpdate(update.update_id))) return; // Telegram retried an update we already handled
  const msg = update.message;
  if (!msg || msg.chat.type !== 'private') return;
  const chatId = msg.chat.id;
  const cmd = parseCommand(msg.text);

  if (cmd?.command === 'start' && cmd.arg) {
    if (!/^[a-f0-9]{24}$/.test(cmd.arg)) return send(chatId, 'Havola noto‘g‘ri. Do‘kondan yangi havola so‘rang.');
    const r = await db.consumeToken(cmd.arg, chatId);
    if (r.status === 'ok' && r.kind === 'contact') {
      return send(
        chatId,
        `Siz “${r.shop_name}” do‘konining mijozi sifatida ulandingiz, ${r.contact_name}.\nQarz muddati yaqinlashganda shu yerga eslatma keladi.\n\n/qarzim — qarzingizni ko‘rish`,
      );
    }
    if (r.status === 'ok' && r.kind === 'owner') {
      return send(chatId, `“${r.shop_name}” ulandi. Har kuni ertalab muddati kelgan qarzlar ro‘yxati shu yerga keladi.`);
    }
    if (r.status === 'used') return send(chatId, 'Bu havola allaqachon ishlatilgan. /qarzim buyrug‘i bilan hisobingizni ko‘ring.');
    if (r.status === 'expired') return send(chatId, 'Havolaning muddati tugagan. Do‘kondan yangi havola so‘rang.');
    return send(chatId, 'Havola topilmadi. Do‘kondan yangi havola so‘rang.');
  }

  if (cmd?.command === 'qarzim' || cmd?.command === 'balance') {
    return send(chatId, balancesText(await db.balancesForChat(chatId)));
  }

  if (cmd?.command === 'stop') {
    const n = await db.unlinkChat(chatId);
    return send(chatId, n > 0 ? 'Eslatmalar to‘xtatildi. Qayta ulanish uchun do‘kondan yangi havola so‘rang.' : 'Siz hech qaysi do‘konga ulanmagansiz.');
  }

  return send(chatId, HELP);
}

export type RunSummary = { sent: number; failed: number; skipped: number };

export async function runDailyReminders(deps: { db: BotRepo; send: Send; now?: Date }): Promise<RunSummary> {
  const { db, send } = deps;
  const today = tashkentToday(deps.now);
  const summary: RunSummary = { sent: 0, failed: 0, skipped: 0 };

  const deliver = async (id: number | null, chatId: number, text: string) => {
    if (id === null) {
      summary.skipped++;
      return;
    }
    try {
      await send(chatId, text);
      await db.finishReminder(id, true);
      summary.sent++;
    } catch (e) {
      await db.finishReminder(id, false, e instanceof Error ? e.message : String(e));
      summary.failed++;
    }
  };

  for (const c of await db.reminderCandidates()) {
    const kind = reminderKind(c.next_due, today);
    if (!kind) continue;
    const id = await db.claimReminder(c.shop_id, c.contact_id, c.chat_id, kind, today);
    await deliver(id, c.chat_id, reminderText({ kind, shopName: c.shop_name, contactName: c.contact_name, balance: c.balance, dueDate: c.next_due }));
  }

  const byChat = new Map<string, DigestItem[]>();
  for (const item of await db.ownerDigestItems(today)) {
    const key = `${item.chat_id}:${item.shop_id}`;
    byChat.set(key, [...(byChat.get(key) ?? []), item]);
  }
  for (const items of byChat.values()) {
    const first = items[0];
    const id = await db.claimReminder(first.shop_id, null, first.chat_id, 'owner_digest', today);
    await deliver(id, first.chat_id, ownerDigestText(first.shop_name, items, today));
  }

  return summary;
}
