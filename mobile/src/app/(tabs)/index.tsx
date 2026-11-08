import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { totals, type ContactKind } from '../../lib/ledger';
import { formatMoney } from '../../lib/money';
import { useContacts, useSummaries } from '../../lib/store';
import { Button, Chip, EmptyState, Segmented } from '../../ui/kit';
import { ContactRow } from '../../ui/rows';
import { colors, font, radius, space } from '../../ui/theme';

type Sort = 'recent' | 'amount' | 'name';

export default function Ledger() {
  const contacts = useContacts();
  const summaries = useSummaries();
  const [kind, setKind] = useState<ContactKind>('customer');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recent');

  const ofKind = useMemo(() => Object.values(contacts).filter((c) => c.kind === kind), [contacts, kind]);
  const sum = useMemo(() => totals(summaries, ofKind.map((c) => c.id)), [summaries, ofKind]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    const filtered = q
      ? ofKind.filter((c) => c.name.toLowerCase().includes(q) || (qDigits.length >= 2 && c.phone?.includes(qDigits)))
      : ofKind;
    const key = (id: string) => summaries[id];
    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'amount') return Math.abs(key(b.id)?.balance ?? 0) - Math.abs(key(a.id)?.balance ?? 0);
      const la = key(a.id)?.lastActivity ?? a.createdAt;
      const lb = key(b.id)?.lastActivity ?? b.createdAt;
      return lb.localeCompare(la);
    });
  }, [ofKind, query, sort, summaries]);

  const label = kind === 'customer' ? 'mijoz' : 'ta’minotchi';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={[]}>
      <FlatList
        data={list}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: space.md, marginBottom: space.sm }}>
            <Segmented
              value={kind}
              onChange={setKind}
              options={[
                { value: 'customer', label: 'Mijozlar' },
                { value: 'supplier', label: 'Ta’minotchilar' },
              ]}
            />
            <View style={s.totals}>
              <View style={[s.total, { backgroundColor: colors.gaveSoft }]}>
                <Text style={s.totalLabel}>Olishim kerak</Text>
                <Text style={[s.totalValue, { color: colors.gave }]} testID="total-receivable">
                  {formatMoney(sum.receivable)}
                </Text>
              </View>
              <View style={[s.total, { backgroundColor: colors.gotSoft }]}>
                <Text style={s.totalLabel}>Berishim kerak</Text>
                <Text style={[s.totalValue, { color: colors.got }]}>{formatMoney(sum.payable)}</Text>
              </View>
            </View>
            {ofKind.length > 0 ? (
              <>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Ism yoki telefon bo‘yicha qidirish"
                  placeholderTextColor={colors.muted}
                  style={s.search}
                  accessibilityLabel="Qidirish"
                />
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Chip label="Oxirgi" active={sort === 'recent'} onPress={() => setSort('recent')} />
                  <Chip label="Summa" active={sort === 'amount'} onPress={() => setSort('amount')} />
                  <Chip label="Ism" active={sort === 'name'} onPress={() => setSort('name')} />
                </View>
              </>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <ContactRow contact={item} summary={summaries[item.id]} onPress={() => router.push(`/contact/${item.id}`)} />
        )}
        ListEmptyComponent={
          ofKind.length === 0 ? (
            <EmptyState
              title={`Hali ${label} yo‘q`}
              body={kind === 'customer' ? 'Birinchi mijozingizni qo‘shing va qarzni yozib boring.' : 'Tovar olgan ta’minotchingizni qo‘shing.'}
              action={<Button title={`+ ${label[0]!.toUpperCase() + label.slice(1)} qo‘shish`} onPress={() => router.push(`/contact/new?kind=${kind}`)} />}
            />
          ) : (
            <EmptyState title="Hech narsa topilmadi" body={`“${query}” bo‘yicha ${label} yo‘q.`} />
          )
        }
      />
      {ofKind.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} qo‘shish`}
          testID="fab-add-contact"
          onPress={() => router.push(`/contact/new?kind=${kind}`)}
          style={({ pressed }) => [s.fab, pressed && { opacity: 0.85 }]}
        >
          <Text style={s.fabText}>+ {kind === 'customer' ? 'Mijoz' : 'Ta’minotchi'}</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  totals: { flexDirection: 'row', gap: space.sm },
  total: { flex: 1, borderRadius: radius.lg, padding: space.md, gap: 4 },
  totalLabel: { fontSize: font.sm, color: colors.text, fontWeight: '600' },
  totalValue: { fontSize: font.lg, fontWeight: '800' },
  search: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    minHeight: 44,
    fontSize: font.md,
    color: colors.text,
  },
  fab: {
    position: 'absolute',
    right: space.lg,
    bottom: space.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: colors.white, fontWeight: '800', fontSize: font.md },
});
