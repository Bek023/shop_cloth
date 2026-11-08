import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleUpdate, runDailyReminders, type BotRepo, type Candidate, type ConsumeResult, type DigestItem } from './bot.ts';
import { balancesText, parseCommand, reminderKind, safeEqual, tashkentToday } from './logic.ts';

function fakeRepo(over: Partial<BotRepo> = {}) {
  const seen = new Set<number>();
  const claimed = new Set<string>();
  const finished: { id: number; ok: boolean; error?: string }[] = [];
  let nextId = 1;
  const repo: BotRepo = {
    markUpdate: async (id) => (seen.has(id) ? false : (seen.add(id), true)),
    consumeToken: async (): Promise<ConsumeResult> => ({ status: 'invalid', kind: null, shop_name: null, contact_name: null }),
    balancesForChat: async () => [],
    unlinkChat: async () => 0,
    reminderCandidates: async () => [],
    ownerDigestItems: async () => [],
    claimReminder: async (shop, contact, chat, kind, period) => {
      const key = [shop, contact, chat, kind, period].join('|');
      if (claimed.has(key)) return null;
      claimed.add(key);
      return nextId++;
    },
    finishReminder: async (id, ok, error) => void finished.push({ id, ok, error }),
    ...over,
  };
  return { repo, finished };
}

function sender() {
  const sent: { chatId: number; text: string }[] = [];
  return { sent, send: async (chatId: number, text: string) => void sent.push({ chatId, text }) };
}

const msg = (update_id: number, text: string, type = 'private') => ({ update_id, message: { chat: { id: 42, type }, text } });

test('start with a valid token links the customer', async () => {
  const { repo } = fakeRepo({
    consumeToken: async (token, chatId) => {
      assert.equal(token, 'a'.repeat(24));
      assert.equal(chatId, 42);
      return { status: 'ok', kind: 'contact', shop_name: 'Nur market', contact_name: 'Laylo' };
    },
  });
  const s = sender();
  await handleUpdate(msg(1, `/start ${'a'.repeat(24)}`), { db: repo, send: s.send });
  assert.match(s.sent[0].text, /Nur market.*Laylo/s);
});

test('malformed token is rejected without touching the database', async () => {
  let called = false;
  const { repo } = fakeRepo({ consumeToken: async () => ((called = true), { status: 'ok', kind: 'contact', shop_name: '', contact_name: '' }) });
  const s = sender();
  await handleUpdate(msg(1, "/start ' or 1=1"), { db: repo, send: s.send });
  assert.equal(called, false);
  assert.match(s.sent[0].text, /noto‘g‘ri/);
});

test('repeated update ids are ignored', async () => {
  const { repo } = fakeRepo();
  const s = sender();
  await handleUpdate(msg(7, '/qarzim'), { db: repo, send: s.send });
  await handleUpdate(msg(7, '/qarzim'), { db: repo, send: s.send });
  assert.equal(s.sent.length, 1);
});

test('group chats are ignored', async () => {
  const { repo } = fakeRepo();
  const s = sender();
  await handleUpdate(msg(1, '/qarzim', 'group'), { db: repo, send: s.send });
  assert.equal(s.sent.length, 0);
});

test('/qarzim lists balances', async () => {
  const { repo } = fakeRepo({
    balancesForChat: async () => [{ shop_name: 'Nur market', contact_name: 'Laylo', balance: 120000, next_due: '2026-11-14' }],
  });
  const s = sender();
  await handleUpdate(msg(1, '/qarzim@NasiyachiBot'), { db: repo, send: s.send });
  assert.match(s.sent[0].text, /Nur market: qarzingiz 120 000 so'm \(muddat: 14-noyabr\)/);
});

test('reminder schedule', () => {
  assert.equal(reminderKind('2026-11-09', '2026-11-08'), 'due_soon');
  assert.equal(reminderKind('2026-11-08', '2026-11-08'), 'due_today');
  assert.equal(reminderKind('2026-11-07', '2026-11-08'), 'overdue');
  assert.equal(reminderKind('2026-11-04', '2026-11-08'), null);
  assert.equal(reminderKind('2026-11-01', '2026-11-08'), 'overdue');
  assert.equal(reminderKind('2026-11-20', '2026-11-08'), null);
});

test('daily job sends once per day and records failures', async () => {
  const candidates: Candidate[] = [
    { contact_id: 'c1', shop_id: 's', chat_id: 1, shop_name: 'Nur', contact_name: 'Laylo', balance: 120000, next_due: '2026-11-08' },
    { contact_id: 'c2', shop_id: 's', chat_id: 2, shop_name: 'Nur', contact_name: 'Bobur', balance: 5000, next_due: '2026-11-30' },
    { contact_id: 'c3', shop_id: 's', chat_id: 3, shop_name: 'Nur', contact_name: 'Blocked', balance: 9000, next_due: '2026-11-09' },
  ];
  const digest: DigestItem[] = [{ chat_id: 9, shop_id: 's', shop_name: 'Nur', contact_name: 'Laylo', balance: 120000, next_due: '2026-11-08' }];
  const { repo, finished } = fakeRepo({ reminderCandidates: async () => candidates, ownerDigestItems: async () => digest });
  const sent: number[] = [];
  const send = async (chatId: number) => {
    if (chatId === 3) throw new Error('Forbidden: bot was blocked by the user');
    sent.push(chatId);
  };
  const now = new Date('2026-11-08T04:00:00Z'); // 09:00 in Tashkent

  const first = await runDailyReminders({ db: repo, send, now });
  assert.deepEqual(first, { sent: 2, failed: 1, skipped: 0 });
  assert.deepEqual(sent, [1, 9]);
  assert.equal(finished.find((f) => !f.ok)?.error, 'Forbidden: bot was blocked by the user');

  const second = await runDailyReminders({ db: repo, send, now });
  assert.deepEqual(second, { sent: 0, failed: 0, skipped: 3 });
});

test('helpers', () => {
  assert.deepEqual(parseCommand('/start@Bot abc'), { command: 'start', arg: 'abc' });
  assert.equal(parseCommand('salom'), null);
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual(null, 'abc'), false);
  assert.equal(tashkentToday(new Date('2026-11-07T20:30:00Z')), '2026-11-08');
  assert.match(balancesText([]), /ulanmagansiz/);
});
