import { useEffect } from 'react';
import { AppState } from 'react-native';
import { supabase } from './backend';
import type { Contact, Tx } from './ledger';
import { useStore } from './store';
import {
  clearPushed,
  contactToRow,
  mergeRemote,
  nextCursor,
  rowToContact,
  rowToTx,
  txToRow,
  type ContactRow,
  type TxRow,
} from './sync-core';

const PAGE = 500;
let running: Promise<void> | null = null;

/** Push local changes, then pull server changes. Safe to call often; runs one at a time. */
export function syncNow(): Promise<void> {
  if (!supabase || !useStore.getState().shopId) return Promise.resolve();
  running ??= doSync().finally(() => {
    running = null;
  });
  return running;
}

async function doSync() {
  const db = supabase!;
  const store = useStore;
  store.setState({ syncing: true });
  try {
    const { shopId } = store.getState();
    if (!shopId) return;

    // ---- push: contacts first, so transactions can reference them
    const s = store.getState();
    const dirtyContacts = Object.keys(s.dirty).filter((id) => s.dirty[id] === 'contact' && s.contacts[id]).map((id) => s.contacts[id]!);
    const dirtyTxs = Object.keys(s.dirty).filter((id) => s.dirty[id] === 'tx' && s.txs[id]).map((id) => s.txs[id]!);
    for (let i = 0; i < dirtyContacts.length; i += PAGE) {
      const batch = dirtyContacts.slice(i, i + PAGE);
      const { error } = await db.from('contacts').upsert(batch.map((c) => contactToRow(c, shopId)), { onConflict: 'id' });
      if (error) throw new Error(error.message);
      clearDirty(batch, (id) => store.getState().contacts[id]?.updatedAt);
    }
    for (let i = 0; i < dirtyTxs.length; i += PAGE) {
      const batch = dirtyTxs.slice(i, i + PAGE);
      const { error } = await db.from('transactions').upsert(batch.map((t) => txToRow(t, shopId)), { onConflict: 'id' });
      if (error) throw new Error(error.message);
      clearDirty(batch, (id) => store.getState().txs[id]?.updatedAt);
    }

    // ---- pull
    await pull<ContactRow, Contact>('contacts', shopId, 'contacts', rowToContact, (remote) => {
      const st = store.getState();
      store.setState({ contacts: mergeRemote(st.contacts, remote, st.dirty) });
    });
    await pull<TxRow, Tx>('transactions', shopId, 'txs', rowToTx, (remote) => {
      const st = store.getState();
      store.setState({ txs: mergeRemote(st.txs, remote, st.dirty) });
    });

    store.setState({ lastSyncAt: new Date().toISOString(), syncError: null });
  } catch (e) {
    store.setState({ syncError: e instanceof Error ? e.message : String(e) });
  } finally {
    store.setState({ syncing: false });
  }
}

function clearDirty(batch: { id: string; updatedAt: string }[], current: (id: string) => string | undefined) {
  const st = useStore.getState();
  useStore.setState({ dirty: clearPushed(st.dirty, batch, current) });
}

async function pull<R extends { server_updated_at?: string }, T>(
  table: 'contacts' | 'transactions',
  shopId: string,
  cursorKey: 'contacts' | 'txs',
  map: (r: R) => T,
  apply: (rows: T[]) => void,
) {
  for (;;) {
    const cursor = useStore.getState().cursors[cursorKey];
    let q = supabase!.from(table).select('*').eq('shop_id', shopId).order('server_updated_at').limit(PAGE);
    if (cursor) q = q.gt('server_updated_at', cursor);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as R[];
    if (rows.length) apply(rows.map(map));
    const st = useStore.getState();
    useStore.setState({ cursors: { ...st.cursors, [cursorKey]: nextCursor(cursor, rows) } });
    if (rows.length < PAGE) return;
  }
}

/**
 * Keeps the phone and the server in step: on start, when the app comes back to the
 * foreground, a few seconds after each local change, and every 5 minutes.
 */
export function useAutoSync() {
  const shopId = useStore((s) => s.shopId);
  const dirtyCount = useStore((s) => Object.keys(s.dirty).length);

  useEffect(() => {
    if (!supabase || !shopId) return;
    syncNow();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && syncNow());
    const timer = setInterval(syncNow, 5 * 60_000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [shopId]);

  useEffect(() => {
    if (!supabase || !shopId || dirtyCount === 0) return;
    const t = setTimeout(syncNow, 2000);
    return () => clearTimeout(t);
  }, [shopId, dirtyCount]);
}
