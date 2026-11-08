import assert from 'node:assert/strict';
import { test } from 'node:test';
import { uuid, UUID_RE } from './ids.ts';
import type { Contact } from './ledger.ts';
import { clearPushed, contactToRow, mergeRemote, nextCursor, rowToContact } from './sync-core.ts';

const c = (id: string, name: string, updatedAt: string): Contact => ({ id, kind: 'customer', name, createdAt: '2026-11-01T00:00:00.000Z', updatedAt });

test('newer remote rows replace local ones', () => {
  const local = { a: c('a', 'Old', '2026-11-01T00:00:00.000Z') };
  const out = mergeRemote(local, [c('a', 'New', '2026-11-02T00:00:00.000Z'), c('b', 'Other', '2026-11-02T00:00:00.000Z')], {});
  assert.equal(out.a.name, 'New');
  assert.equal(out.b.name, 'Other');
});

test('a newer unpushed local edit survives a pull', () => {
  const local = { a: c('a', 'Mine', '2026-11-03T00:00:00.000Z') };
  const out = mergeRemote(local, [c('a', 'Theirs', '2026-11-02T00:00:00.000Z')], { a: 'contact' });
  assert.equal(out.a.name, 'Mine');
  assert.equal(out, local, 'unchanged state keeps its identity');
});

test('an older local copy loses even when dirty', () => {
  const local = { a: c('a', 'Mine', '2026-11-01T00:00:00.000Z') };
  const out = mergeRemote(local, [c('a', 'Theirs', '2026-11-02T00:00:00.000Z')], { a: 'contact' });
  assert.equal(out.a.name, 'Theirs');
});

test('push clears only records unchanged since sending', () => {
  const dirty = { a: 'contact', b: 'tx' } as const;
  const next = clearPushed({ ...dirty }, [{ id: 'a', updatedAt: 't1' }, { id: 'b', updatedAt: 't1' }], (id) => (id === 'a' ? 't1' : 't2'));
  assert.deepEqual(next, { b: 'tx' });
});

test('row mapping round-trips', () => {
  const contact: Contact = { ...c('a', 'Aziz', '2026-11-02T00:00:00.000Z'), phone: '901234567', deletedAt: '2026-11-03T00:00:00.000Z' };
  const row = contactToRow(contact, 'shop');
  assert.equal(row.shop_id, 'shop');
  assert.equal(row.note, null);
  const back = JSON.parse(JSON.stringify(rowToContact({ ...row, updated_at: '2026-11-02T00:00:00+00:00' })));
  assert.deepEqual(back, contact);
});

test('cursor advances to the newest server time', () => {
  assert.equal(nextCursor(null, [{ server_updated_at: '2026-11-02' }, { server_updated_at: '2026-11-03' }]), '2026-11-03');
  assert.equal(nextCursor('2026-11-05', [{ server_updated_at: '2026-11-03' }]), '2026-11-05');
});

test('uuid format', () => {
  for (let i = 0; i < 50; i++) assert.match(uuid(), UUID_RE);
});
