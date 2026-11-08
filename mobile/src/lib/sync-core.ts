// Pure sync logic: row mapping and merging. No network, tested in sync-core.test.ts.
import type { Contact, Tx } from './ledger';

export type ContactRow = {
  id: string;
  shop_id: string;
  kind: Contact['kind'];
  name: string;
  phone: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  server_updated_at?: string;
};

export type TxRow = {
  id: string;
  shop_id: string;
  contact_id: string;
  type: Tx['type'];
  amount: number;
  note: string | null;
  occurred_at: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  server_updated_at?: string;
};

export type Dirty = Record<string, 'contact' | 'tx'>;

export const contactToRow = (c: Contact, shopId: string): ContactRow => ({
  id: c.id,
  shop_id: shopId,
  kind: c.kind,
  name: c.name,
  phone: c.phone ?? null,
  note: c.note ?? null,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
  deleted_at: c.deletedAt ?? null,
});

export const txToRow = (t: Tx, shopId: string): TxRow => ({
  id: t.id,
  shop_id: shopId,
  contact_id: t.contactId,
  type: t.type,
  amount: t.amount,
  note: t.note ?? null,
  occurred_at: t.occurredAt,
  due_date: t.type === 'gave' ? (t.dueDate ?? null) : null,
  created_at: t.createdAt,
  updated_at: t.updatedAt,
  deleted_at: t.deletedAt ?? null,
});

export const rowToContact = (r: ContactRow): Contact => ({
  id: r.id,
  kind: r.kind,
  name: r.name,
  phone: r.phone ?? undefined,
  note: r.note ?? undefined,
  createdAt: new Date(r.created_at).toISOString(),
  updatedAt: new Date(r.updated_at).toISOString(),
  deletedAt: r.deleted_at ? new Date(r.deleted_at).toISOString() : undefined,
});

export const rowToTx = (r: TxRow): Tx => ({
  id: r.id,
  contactId: r.contact_id,
  type: r.type,
  amount: Number(r.amount),
  note: r.note ?? undefined,
  occurredAt: new Date(r.occurred_at).toISOString(),
  dueDate: r.due_date ?? undefined,
  createdAt: new Date(r.created_at).toISOString(),
  updatedAt: new Date(r.updated_at).toISOString(),
  deletedAt: r.deleted_at ? new Date(r.deleted_at).toISOString() : undefined,
});

/**
 * Applies pulled server rows to local state. Last write wins on updatedAt, except that a
 * local record still waiting to be pushed keeps its own version when it is newer.
 */
export function mergeRemote<T extends { id: string; updatedAt: string }>(
  local: Record<string, T>,
  remote: T[],
  dirty: Dirty,
): Record<string, T> {
  let out = local;
  for (const r of remote) {
    const l = local[r.id];
    if (l && dirty[r.id] && l.updatedAt > r.updatedAt) continue;
    if (l && l.updatedAt > r.updatedAt) continue;
    if (out === local) out = { ...local };
    out[r.id] = r;
  }
  return out;
}

/** After a push, forget dirty ids whose record has not changed since it was sent. */
export function clearPushed(dirty: Dirty, pushed: { id: string; updatedAt: string }[], current: (id: string) => string | undefined): Dirty {
  const next = { ...dirty };
  for (const p of pushed) if (current(p.id) === p.updatedAt) delete next[p.id];
  return next;
}

/** Highest server_updated_at among rows, for the next pull. */
export function nextCursor(prev: string | null, rows: { server_updated_at?: string }[]): string | null {
  let c = prev;
  for (const r of rows) if (r.server_updated_at && (!c || r.server_updated_at > c)) c = r.server_updated_at;
  return c;
}
