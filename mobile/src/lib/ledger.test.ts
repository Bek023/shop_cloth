import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dueStatus, history, periodStats, summarize, totals, type Tx } from './ledger.ts';
import { formatMoney, formatPhone, parseAmount, parsePhone } from './money.ts';

function tx(id: string, contactId: string, type: Tx['type'], amount: number, occurredAt: string, extra: Partial<Tx> = {}): Tx {
  return { id, contactId, type, amount, occurredAt, createdAt: occurredAt, updatedAt: occurredAt, ...extra };
}

const txs: Record<string, Tx> = {
  a: tx('a', 'ali', 'gave', 500_000, '2026-11-01T10:00:00Z', { dueDate: '2026-11-05' }),
  b: tx('b', 'ali', 'got', 200_000, '2026-11-03T10:00:00Z'),
  c: tx('c', 'vali', 'gave', 100_000, '2026-11-02T10:00:00Z', { dueDate: '2026-11-20' }),
  d: tx('d', 'vali', 'got', 150_000, '2026-11-04T10:00:00Z'), // overpaid
  e: tx('e', 'ali', 'gave', 999_999, '2026-11-04T10:00:00Z', { deletedAt: '2026-11-04T11:00:00Z' }),
};

test('balances ignore deleted transactions', () => {
  const s = summarize(txs);
  assert.equal(s.ali.balance, 300_000);
  assert.equal(s.ali.txCount, 2);
  assert.equal(s.vali.balance, -50_000);
});

test('due date is dropped once the debt is settled', () => {
  const s = summarize(txs);
  assert.equal(s.ali.nextDue, '2026-11-05');
  assert.equal(s.vali.nextDue, undefined);
});

test('totals split receivable and payable', () => {
  assert.deepEqual(totals(summarize(txs)), { receivable: 300_000, payable: 50_000 });
});

test('history has running balance, newest first', () => {
  const h = history(txs, 'ali');
  assert.deepEqual(h.map((r) => [r.tx.id, r.balanceAfter]), [['b', 300_000], ['a', 500_000]]);
});

test('period stats respect bounds', () => {
  const p = periodStats(txs, { from: '2026-11-02T00:00:00Z', to: '2026-11-04T00:00:00Z' });
  assert.deepEqual(p, { gave: 100_000, got: 200_000, count: 2 });
});

test('due status', () => {
  assert.equal(dueStatus('2026-11-01', '2026-11-05'), 'overdue');
  assert.equal(dueStatus('2026-11-05', '2026-11-05'), 'today');
  assert.equal(dueStatus('2026-11-07', '2026-11-05'), 'soon');
  assert.equal(dueStatus('2026-11-30', '2026-11-05'), 'later');
});

test('money parsing and formatting', () => {
  assert.equal(parseAmount('1 250 000'), 1_250_000);
  assert.equal(parseAmount('00abc'), 0);
  assert.equal(formatMoney(1_250_000), "1 250 000 so'm");
  assert.equal(formatMoney(-5000), "-5 000 so'm");
  assert.equal(formatMoney(5000, { sign: true }), "+5 000 so'm");
});

test('phone parsing and formatting', () => {
  assert.equal(parsePhone('+998 90 123 45 67'), '901234567');
  assert.equal(formatPhone('901234567'), '+998 90 123 45 67');
  assert.equal(formatPhone('9012'), '+998 90 12');
});
