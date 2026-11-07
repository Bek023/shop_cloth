// Pure ledger logic: no React, no storage. Tested in ledger.test.ts.

export type ContactKind = 'customer' | 'supplier';

/** gave = men berdim (qarz/tovar berdim), got = men oldim (to'lov yoki tovar oldim). */
export type TxType = 'gave' | 'got';

export type Contact = {
  id: string;
  kind: ContactKind;
  name: string;
  phone?: string; // 9 digits after +998
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type Tx = {
  id: string;
  contactId: string;
  type: TxType;
  amount: number; // integer so'm, > 0
  note?: string;
  occurredAt: string;
  dueDate?: string; // YYYY-MM-DD, only meaningful for "gave"
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // soft delete keeps history auditable
};

export type ContactSummary = {
  balance: number; // > 0: u menga qarzdor (olishim kerak); < 0: men unga qarzdorman (berishim kerak)
  lastActivity?: string;
  nextDue?: string; // earliest due date among open debts
  txCount: number;
};

export function signed(tx: Pick<Tx, 'type' | 'amount'>): number {
  return tx.type === 'gave' ? tx.amount : -tx.amount;
}

export function liveTxs(txs: Record<string, Tx>): Tx[] {
  return Object.values(txs).filter((t) => !t.deletedAt);
}

export function summarize(txs: Record<string, Tx>): Record<string, ContactSummary> {
  const out: Record<string, ContactSummary> = {};
  for (const t of liveTxs(txs)) {
    const s = (out[t.contactId] ??= { balance: 0, txCount: 0 });
    s.balance += signed(t);
    s.txCount += 1;
    if (!s.lastActivity || t.occurredAt > s.lastActivity) s.lastActivity = t.occurredAt;
    if (t.type === 'gave' && t.dueDate && (!s.nextDue || t.dueDate < s.nextDue)) s.nextDue = t.dueDate;
  }
  // A due date only matters while the contact still owes money.
  for (const s of Object.values(out)) if (s.balance <= 0) delete s.nextDue;
  return out;
}

export type Totals = { receivable: number; payable: number };

/** receivable = olishim kerak (sum of positive balances), payable = berishim kerak. */
export function totals(summaries: Record<string, ContactSummary>, contactIds?: string[]): Totals {
  const ids = contactIds ?? Object.keys(summaries);
  let receivable = 0;
  let payable = 0;
  for (const id of ids) {
    const b = summaries[id]?.balance ?? 0;
    if (b > 0) receivable += b;
    else payable -= b;
  }
  return { receivable, payable };
}

/** Running balance after each transaction, newest first, for the contact screen. */
export function history(txs: Record<string, Tx>, contactId: string): { tx: Tx; balanceAfter: number }[] {
  const list = liveTxs(txs)
    .filter((t) => t.contactId === contactId)
    .sort((a, b) => (a.occurredAt === b.occurredAt ? a.createdAt.localeCompare(b.createdAt) : a.occurredAt.localeCompare(b.occurredAt)));
  let run = 0;
  const rows = list.map((tx) => ({ tx, balanceAfter: (run += signed(tx)) }));
  return rows.reverse();
}

export type Period = { from: string; to: string }; // ISO, inclusive from, exclusive to

export function periodStats(txs: Record<string, Tx>, period: Period, contactIds?: Set<string>) {
  let gave = 0;
  let got = 0;
  let count = 0;
  for (const t of liveTxs(txs)) {
    if (t.occurredAt < period.from || t.occurredAt >= period.to) continue;
    if (contactIds && !contactIds.has(t.contactId)) continue;
    if (t.type === 'gave') gave += t.amount;
    else got += t.amount;
    count += 1;
  }
  return { gave, got, count };
}

export function todayISODate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return todayISODate(new Date(y, m - 1, d + days));
}

export type DueStatus = 'overdue' | 'today' | 'soon' | 'later';

export function dueStatus(dueDate: string, today = todayISODate()): DueStatus {
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  if (dueDate <= addDays(today, 3)) return 'soon';
  return 'later';
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
