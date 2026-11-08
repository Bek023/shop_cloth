// Pure helpers shared by the Edge Functions. No Deno or npm imports, so Node tests can load it too.

export function formatMoney(n: number): string {
  const s = Math.abs(Math.trunc(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${n < 0 ? '-' : ''}${s} so'm`;
}

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

/** "2026-11-14" -> "14-noyabr" */
export function formatDay(isoDate: string): string {
  const [, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return `${d}-${MONTHS[m - 1]}`;
}

/** Today's date in Tashkent (UTC+5, no DST) as YYYY-MM-DD. */
export function tashkentToday(now: Date = new Date()): string {
  return new Date(now.getTime() + 5 * 3600_000).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso.slice(0, 10)) - Date.parse(fromIso.slice(0, 10))) / 86_400_000);
}

export type ReminderKind = 'due_soon' | 'due_today' | 'overdue';

/**
 * Which reminder, if any, goes out today for a debt due on dueDate.
 * The day before, on the day, then the day after and every 7 days while unpaid.
 */
export function reminderKind(dueDate: string, today: string): ReminderKind | null {
  const d = daysBetween(dueDate, today); // > 0: days overdue
  if (d === -1) return 'due_soon';
  if (d === 0) return 'due_today';
  if (d === 1 || (d > 0 && d % 7 === 0)) return 'overdue';
  return null;
}

export function reminderText(p: { kind: ReminderKind; shopName: string; contactName: string; balance: number; dueDate: string }): string {
  const head = `Assalomu alaykum, ${p.contactName}!`;
  const debt = `“${p.shopName}” do‘konidan qarzingiz: ${formatMoney(p.balance)}.`;
  const when =
    p.kind === 'due_soon'
      ? `To‘lov muddati ertaga, ${formatDay(p.dueDate)}.`
      : p.kind === 'due_today'
        ? 'To‘lov muddati bugun.'
        : `To‘lov muddati ${formatDay(p.dueDate)} kuni o‘tgan.`;
  return `${head}\n${debt}\n${when}\n\nQoldiqni ko‘rish: /qarzim`;
}

export type BalanceRow = { shop_name: string; contact_name: string; balance: number; next_due: string | null };

export function balancesText(rows: BalanceRow[]): string {
  if (rows.length === 0) return 'Siz hali hech qaysi do‘konga ulanmagansiz. Do‘kondan olgan havolangizni bosing.';
  const lines = rows.map((r) => {
    const state =
      r.balance > 0 ? `qarzingiz ${formatMoney(r.balance)}` : r.balance < 0 ? `oldindan to‘lov ${formatMoney(-r.balance)}` : 'qarz yo‘q';
    const due = r.balance > 0 && r.next_due ? ` (muddat: ${formatDay(r.next_due)})` : '';
    return `• ${r.shop_name}: ${state}${due}`;
  });
  return `Hisobingiz:\n${lines.join('\n')}`;
}

export type DigestRow = { contact_name: string; balance: number; next_due: string };

export function ownerDigestText(shopName: string, rows: DigestRow[], today: string): string {
  const total = rows.reduce((s, r) => s + r.balance, 0);
  const lines = rows.slice(0, 20).map((r) => {
    const d = daysBetween(r.next_due, today);
    const when = d === 0 ? 'bugun' : `${d} kun o‘tgan`;
    return `• ${r.contact_name}: ${formatMoney(r.balance)} (${when})`;
  });
  const more = rows.length > 20 ? `\n… yana ${rows.length - 20} ta` : '';
  return `${shopName}: bugungi qarzlar\nJami: ${formatMoney(total)}, ${rows.length} kishi\n\n${lines.join('\n')}${more}`;
}

/** "/start abc123" -> { command: 'start', arg: 'abc123' }. Handles "/start@MyBot abc". */
export function parseCommand(text: string | undefined): { command: string; arg: string } | null {
  const m = /^\/([a-z_]+)(?:@\w+)?(?:\s+(.+))?$/i.exec((text ?? '').trim());
  return m ? { command: m[1].toLowerCase(), arg: (m[2] ?? '').trim() } : null;
}

/** Constant-time comparison for webhook secrets. */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
