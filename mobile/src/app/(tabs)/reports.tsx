import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { periodStats, totals, type ContactKind, type Period } from '../../lib/ledger';
import { formatMoney } from '../../lib/money';
import { useStore, useSummaries } from '../../lib/store';
import { Card, Chip, Screen, Segmented, SectionTitle, styles } from '../../ui/kit';
import { BalanceText } from '../../ui/rows';
import { colors, font, space } from '../../ui/theme';

type Range = 'day' | 'month' | 'year';

function periodFor(range: Range, now = new Date()): Period {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const [from, to] =
    range === 'day'
      ? [new Date(y, m, d), new Date(y, m, d + 1)]
      : range === 'month'
        ? [new Date(y, m, 1), new Date(y, m + 1, 1)]
        : [new Date(y, 0, 1), new Date(y + 1, 0, 1)];
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function Reports() {
  const contacts = useStore((s) => s.contacts);
  const txs = useStore((s) => s.txs);
  const summaries = useSummaries();
  const [kind, setKind] = useState<ContactKind>('customer');
  const [range, setRange] = useState<Range>('month');

  const ids = useMemo(() => Object.values(contacts).filter((c) => c.kind === kind).map((c) => c.id), [contacts, kind]);
  const sum = useMemo(() => totals(summaries, ids), [summaries, ids]);
  const stats = useMemo(() => periodStats(txs, periodFor(range), new Set(ids)), [txs, range, ids]);
  const top = useMemo(
    () =>
      ids
        .map((id) => ({ c: contacts[id]!, b: summaries[id]?.balance ?? 0 }))
        .filter((r) => r.b > 0)
        .sort((a, b) => b.b - a.b)
        .slice(0, 5),
    [ids, contacts, summaries],
  );

  return (
    <Screen edges={[]}>
      <Segmented
        value={kind}
        onChange={setKind}
        options={[
          { value: 'customer', label: 'Mijozlar' },
          { value: 'supplier', label: 'Ta’minotchilar' },
        ]}
      />

      <SectionTitle>Hozirgi holat</SectionTitle>
      <Card style={{ gap: space.md }}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.body}>Olishim kerak</Text>
          <Text style={{ color: colors.gave, fontWeight: '800', fontSize: font.lg }}>{formatMoney(sum.receivable)}</Text>
        </View>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.body}>Berishim kerak</Text>
          <Text style={{ color: colors.got, fontWeight: '800', fontSize: font.lg }}>{formatMoney(sum.payable)}</Text>
        </View>
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={[styles.body, { fontWeight: '700' }]}>Sof balans</Text>
          <Text style={{ fontWeight: '800', fontSize: font.lg, color: colors.text }}>
            {formatMoney(sum.receivable - sum.payable)}
          </Text>
        </View>
      </Card>

      <SectionTitle>Davr bo‘yicha</SectionTitle>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Chip label="Bugun" active={range === 'day'} onPress={() => setRange('day')} />
        <Chip label="Shu oy" active={range === 'month'} onPress={() => setRange('month')} />
        <Chip label="Shu yil" active={range === 'year'} onPress={() => setRange('year')} />
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Card style={{ flex: 1, gap: 4, backgroundColor: colors.gaveSoft }}>
          <Text style={styles.muted}>Berdim</Text>
          <Text style={{ color: colors.gave, fontWeight: '800', fontSize: font.lg }}>{formatMoney(stats.gave)}</Text>
        </Card>
        <Card style={{ flex: 1, gap: 4, backgroundColor: colors.gotSoft }}>
          <Text style={styles.muted}>Oldim</Text>
          <Text style={{ color: colors.got, fontWeight: '800', fontSize: font.lg }}>{formatMoney(stats.got)}</Text>
        </Card>
      </View>
      <Text style={styles.muted}>{stats.count} ta yozuv</Text>

      {top.length > 0 ? (
        <>
          <SectionTitle>{kind === 'customer' ? 'Eng katta qarzdorlar' : 'Eng katta haqdorlar'}</SectionTitle>
          <Card style={{ gap: space.md }}>
            {top.map(({ c, b }) => (
              <View key={c.id} style={[styles.row, { justifyContent: 'space-between' }]}>
                <Text style={styles.body} numberOfLines={1}>
                  {c.name}
                </Text>
                <BalanceText balance={b} />
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
