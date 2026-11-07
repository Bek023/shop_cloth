import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { dueStatus, todayISODate } from '../../lib/ledger';
import { useStore, useSummaries } from '../../lib/store';
import { Chip, EmptyState } from '../../ui/kit';
import { ContactRow } from '../../ui/rows';
import { space } from '../../ui/theme';

type Filter = 'overdue' | 'today' | 'week' | 'all';

export default function Due() {
  const contacts = useStore((s) => s.contacts);
  const summaries = useSummaries();
  const [filter, setFilter] = useState<Filter>('overdue');

  const rows = useMemo(() => {
    const today = todayISODate();
    return Object.values(contacts)
      .filter((c) => {
        const due = summaries[c.id]?.nextDue;
        if (!due) return false;
        const st = dueStatus(due, today);
        if (filter === 'overdue') return st === 'overdue';
        if (filter === 'today') return st === 'today';
        if (filter === 'week') return st !== 'later';
        return true;
      })
      .sort((a, b) => summaries[a.id]!.nextDue!.localeCompare(summaries[b.id]!.nextDue!));
  }, [contacts, summaries, filter]);

  return (
    <FlatList
      data={rows}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ padding: space.lg, gap: space.sm }}
      ListHeaderComponent={
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm }}>
          <Chip label="Muddati o‘tgan" active={filter === 'overdue'} onPress={() => setFilter('overdue')} />
          <Chip label="Bugun" active={filter === 'today'} onPress={() => setFilter('today')} />
          <Chip label="Shu hafta" active={filter === 'week'} onPress={() => setFilter('week')} />
          <Chip label="Hammasi" active={filter === 'all'} onPress={() => setFilter('all')} />
        </View>
      }
      renderItem={({ item }) => (
        <ContactRow contact={item} summary={summaries[item.id]} onPress={() => router.push(`/contact/${item.id}`)} />
      )}
      ListEmptyComponent={
        <EmptyState
          title={filter === 'overdue' ? 'Muddati o‘tgan qarz yo‘q' : 'Bu yerda hech kim yo‘q'}
          body="Qarz yozayotganda qaytarish muddatini belgilasangiz, u shu yerda chiqadi."
        />
      }
    />
  );
}
