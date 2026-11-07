import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { newId, summarize, type Contact, type ContactKind, type Tx, type TxType } from './ledger';

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
};

type Session = {
  /** Phone being verified during sign-in. Not persisted. */
  pendingPhone: string | null;
  /** PIN entered this session. Not persisted, so the lock shows on every cold start. */
  unlocked: boolean;
  hydrated: boolean;
};

type Actions = {
  startSignIn(phone: string): void;
  completeSignIn(): 'new' | 'existing';
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

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      profile: null,
      pin: null,
      contacts: {},
      txs: {},
      pendingPhone: null,
      unlocked: false,
      hydrated: false,

      startSignIn: (phone) => set({ pendingPhone: phone }),

      // Demo backend: the local profile is "the account". With a real backend
      // this is where the server session and data download would happen.
      completeSignIn: () => {
        const { pendingPhone, profile } = get();
        if (!pendingPhone) throw new Error('No phone to verify');
        if (profile && profile.phone === pendingPhone) {
          set({ pendingPhone: null, unlocked: true });
          return 'existing';
        }
        set({ pendingPhone: null, unlocked: true, profile: null, pin: null, contacts: {}, txs: {} });
        set({ profile: { phone: pendingPhone, shopName: '', createdAt: now() } });
        return 'new';
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
      signOut: () => set({ profile: null, pin: null, contacts: {}, txs: {}, unlocked: false, pendingPhone: null }),

      addContact: (c) => {
        const id = newId();
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
        set((s) => ({ contacts: { ...s.contacts, [id]: contact } }));
        return id;
      },
      updateContact: (id, patch) =>
        set((s) => {
          const c = s.contacts[id];
          if (!c) return s;
          return { contacts: { ...s.contacts, [id]: { ...c, ...patch, name: (patch.name ?? c.name).trim(), updatedAt: now() } } };
        }),
      deleteContact: (id) =>
        set((s) => {
          const contacts = { ...s.contacts };
          delete contacts[id];
          const txs = Object.fromEntries(Object.entries(s.txs).filter(([, t]) => t.contactId !== id));
          return { contacts, txs };
        }),

      addTx: (t) => {
        if (!Number.isInteger(t.amount) || t.amount <= 0) throw new Error('Amount must be a positive integer');
        const id = newId();
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
        set((s) => ({ txs: { ...s.txs, [id]: tx } }));
        return id;
      },
      updateTx: (id, patch) =>
        set((s) => {
          const t = s.txs[id];
          if (!t) return s;
          return { txs: { ...s.txs, [id]: { ...t, ...patch, updatedAt: now() } } };
        }),
      deleteTx: (id) =>
        set((s) => {
          const t = s.txs[id];
          if (!t) return s;
          return { txs: { ...s.txs, [id]: { ...t, deletedAt: now() } } };
        }),
    }),
    {
      name: 'nasiyachi-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): Data => ({ profile: s.profile, pin: s.pin, contacts: s.contacts, txs: s.txs }),
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);

/** Balance summaries for every contact, recomputed only when transactions change. */
export function useSummaries() {
  const txs = useStore((s) => s.txs);
  return useMemo(() => summarize(txs), [txs]);
}
