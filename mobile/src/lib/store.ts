import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { uuid, UUID_RE } from './ids';
import { liveContacts, summarize, type Contact, type ContactKind, type Tx, type TxType } from './ledger';
import type { Dirty } from './sync-core';

export type Profile = {
  phone: string; // 9 digits after +998
  shopName: string;
  ownerName?: string;
  createdAt: string;
};

type Data = {
  profile: Profile | null;
  pin: string | null;
  contacts: Record<string, Contact>;
  txs: Record<string, Tx>;
  /** Server shop id once signed in with the backend; null in demo mode. */
  shopId: string | null;
  /** Records changed locally and not yet pushed. */
  dirty: Dirty;
  cursors: { contacts: string | null; txs: string | null };
  lastSyncAt: string | null;
};

type Session = {
  pendingPhone: string | null;
  unlocked: boolean;
  hydrated: boolean;
  syncing: boolean;
  syncError: string | null;
  /** "Forgot PIN" was tapped; the PIN is removed once the SMS code is verified. */
  resetPinRequested: boolean;
};

type Actions = {
  startSignIn(phone: string): void;
  completeSignIn(): 'new' | 'existing';
  /** Backend sign-in finished. shop is the user's existing shop, if any. */
  signedIn(p: { phone: string; shop: { id: string; name: string; owner_name: string | null } | null }): void;
  setShop(shop: { id: string; name: string; owner_name: string | null }): void;
  saveProfile(p: Pick<Profile, 'shopName' | 'ownerName'>): void;
  setPin(pin: string | null): void;
  unlock(pin: string): boolean;
  lock(): void;
  signOut(): void;

  addContact(c: { kind: ContactKind; name: string; phone?: string; note?: string }): string;
  updateContact(id: string, patch: Partial<Pick<Contact, 'name' | 'phone' | 'note'>>): void;
  deleteContact(id: string): void;

  addTx(t: { contactId: string; type: TxType; amount: number; note?: string; dueDate?: string; occurredAt?: string }): string;
  updateTx(id: string, patch: Partial<Pick<Tx, 'amount' | 'note' | 'dueDate'>>): void;
  deleteTx(id: string): void;
};

export type State = Data & Session & Actions;

const now = () => new Date().toISOString();

const EMPTY_DATA: Data = {
  profile: null,
  pin: null,
  contacts: {},
  txs: {},
  shopId: null,
  dirty: {},
  cursors: { contacts: null, txs: null },
  lastSyncAt: null,
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...EMPTY_DATA,
      pendingPhone: null,
      unlocked: false,
      hydrated: false,
      syncing: false,
      syncError: null,
      resetPinRequested: false,

      startSignIn: (phone) => set({ pendingPhone: phone }),

      // Demo mode: the local profile is "the account".
      completeSignIn: () => {
        const { pendingPhone, profile } = get();
        if (!pendingPhone) throw new Error('No phone to verify');
        if (profile && profile.phone === pendingPhone) {
          set({ pendingPhone: null, unlocked: true });
          return 'existing';
        }
        set({ ...EMPTY_DATA, pendingPhone: null, unlocked: true, profile: { phone: pendingPhone, shopName: '', createdAt: now() } });
        return 'new';
      },

      signedIn: ({ phone, shop }) => {
        const s = get();
        const profile: Profile = {
          phone,
          shopName: shop?.name ?? s.profile?.shopName ?? '',
          ownerName: shop?.owner_name ?? s.profile?.ownerName,
          createdAt: s.profile?.createdAt ?? now(),
        };
        if (shop && s.shopId === shop.id) {
          // Same account on the same phone: keep everything.
          set({ pendingPhone: null, unlocked: true, profile });
        } else if (shop) {
          // Existing account, new or different local data: start clean and pull from the server.
          set({ ...EMPTY_DATA, pin: s.pin, pendingPhone: null, unlocked: true, shopId: shop.id, profile });
        } else {
          // New account: keep what was entered in demo mode; it is uploaded once the shop exists.
          set({ pendingPhone: null, unlocked: true, shopId: null, profile, cursors: EMPTY_DATA.cursors, dirty: allDirty(s) });
        }
      },

      setShop: (shop) => {
        const profile = get().profile;
        set({
          shopId: shop.id,
          profile: profile ? { ...profile, shopName: shop.name, ownerName: shop.owner_name ?? undefined } : profile,
          dirty: { ...get().dirty, ...allDirty(get()) },
        });
      },

      saveProfile: (p) => {
        const profile = get().profile;
        if (!profile) return;
        set({ profile: { ...profile, shopName: p.shopName.trim(), ownerName: p.ownerName?.trim() || undefined } });
      },

      setPin: (pin) => set({ pin, unlocked: true }),
      unlock: (pin) => {
        const ok = get().pin === pin;
        if (ok) set({ unlocked: true });
        return ok;
      },
      lock: () => set({ unlocked: false }),
      signOut: () => set({ ...EMPTY_DATA, unlocked: false, pendingPhone: null, syncError: null }),

      addContact: (c) => {
        const id = uuid();
        const t = now();
        const contact: Contact = {
          id,
          kind: c.kind,
          name: c.name.trim(),
          phone: c.phone || undefined,
          note: c.note?.trim() || undefined,
          createdAt: t,
          updatedAt: t,
        };
        set((s) => ({ contacts: { ...s.contacts, [id]: contact }, dirty: { ...s.dirty, [id]: 'contact' } }));
        return id;
      },
      updateContact: (id, patch) =>
        set((s) => {
          const c = s.contacts[id];
          if (!c) return s;
          return {
            contacts: { ...s.contacts, [id]: { ...c, ...patch, name: (patch.name ?? c.name).trim(), updatedAt: now() } },
            dirty: { ...s.dirty, [id]: 'contact' },
          };
        }),
      deleteContact: (id) =>
        set((s) => {
          const c = s.contacts[id];
          if (!c) return s;
          const t = now();
          const txs = { ...s.txs };
          const dirty: Dirty = { ...s.dirty, [id]: 'contact' };
          for (const tx of Object.values(s.txs)) {
            if (tx.contactId === id && !tx.deletedAt) {
              txs[tx.id] = { ...tx, deletedAt: t, updatedAt: t };
              dirty[tx.id] = 'tx';
            }
          }
          return { contacts: { ...s.contacts, [id]: { ...c, deletedAt: t, updatedAt: t } }, txs, dirty };
        }),

      addTx: (t) => {
        if (!Number.isInteger(t.amount) || t.amount <= 0) throw new Error('Amount must be a positive integer');
        const id = uuid();
        const ts = now();
        const tx: Tx = {
          id,
          contactId: t.contactId,
          type: t.type,
          amount: t.amount,
          note: t.note?.trim() || undefined,
          dueDate: t.type === 'gave' ? t.dueDate : undefined,
          occurredAt: t.occurredAt ?? ts,
          createdAt: ts,
          updatedAt: ts,
        };
        set((s) => ({ txs: { ...s.txs, [id]: tx }, dirty: { ...s.dirty, [id]: 'tx' } }));
        return id;
      },
      updateTx: (id, patch) =>
        set((s) => {
          const t = s.txs[id];
          if (!t) return s;
          return { txs: { ...s.txs, [id]: { ...t, ...patch, updatedAt: now() } }, dirty: { ...s.dirty, [id]: 'tx' } };
        }),
      deleteTx: (id) =>
        set((s) => {
          const t = s.txs[id];
          if (!t) return s;
          const ts = now();
          return { txs: { ...s.txs, [id]: { ...t, deletedAt: ts, updatedAt: ts } }, dirty: { ...s.dirty, [id]: 'tx' } };
        }),
    }),
    {
      name: 'nasiyachi-v1',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): Data => ({
        profile: s.profile,
        pin: s.pin,
        contacts: s.contacts,
        txs: s.txs,
        shopId: s.shopId,
        dirty: s.dirty,
        cursors: s.cursors,
        lastSyncAt: s.lastSyncAt,
      }),
      migrate: (persisted, version) => (version < 2 ? migrateV1(persisted as Partial<Data>) : (persisted as Data)),
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);

function allDirty(s: Pick<Data, 'contacts' | 'txs'>): Dirty {
  const d: Dirty = {};
  for (const id of Object.keys(s.contacts)) d[id] = 'contact';
  for (const id of Object.keys(s.txs)) d[id] = 'tx';
  return d;
}

/** v1 used short random ids; the server needs UUIDs. Remap every id and keep links intact. */
export function migrateV1(old: Partial<Data>): Data {
  const map = new Map<string, string>();
  const idFor = (id: string) => {
    if (UUID_RE.test(id)) return id;
    if (!map.has(id)) map.set(id, uuid());
    return map.get(id)!;
  };
  const contacts: Record<string, Contact> = {};
  for (const c of Object.values(old.contacts ?? {})) {
    const id = idFor(c.id);
    contacts[id] = { ...c, id };
  }
  const txs: Record<string, Tx> = {};
  for (const t of Object.values(old.txs ?? {})) {
    const id = idFor(t.id);
    txs[id] = { ...t, id, contactId: idFor(t.contactId) };
  }
  return { ...EMPTY_DATA, profile: old.profile ?? null, pin: old.pin ?? null, contacts, txs };
}

/** Contacts that are not deleted, recomputed only when contacts change. */
export function useContacts() {
  const contacts = useStore((s) => s.contacts);
  return useMemo(() => liveContacts(contacts), [contacts]);
}

/** A single live contact, or undefined if missing or deleted. */
export function useContact(id: string | undefined) {
  return useStore((s) => {
    const c = id ? s.contacts[id] : undefined;
    return c && !c.deletedAt ? c : undefined;
  });
}

/** Balance summaries for every contact, recomputed only when transactions change. */
export function useSummaries() {
  const txs = useStore((s) => s.txs);
  return useMemo(() => summarize(txs), [txs]);
}
