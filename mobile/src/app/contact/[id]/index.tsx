import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { history } from '../../../lib/ledger';
import { formatMoney, formatPhone } from '../../../lib/money';
import { useStore, useSummaries } from '../../../lib/store';
import { confirm } from '../../../ui/confirm';
import { Avatar, Button, EmptyState, styles } from '../../../ui/kit';
import { balanceLabel, DueBadge, TxRow } from '../../../ui/rows';
import { colors, font, radius, space } from '../../../ui/theme';

export default function ContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contact = useStore((s) => s.contacts[id]);
  const txs = useStore((s) => s.txs);
  const deleteContact = useStore((s) => s.deleteContact);
  const summary = useSummaries()[id];
  const rows = useMemo(() => history(txs, id), [txs, id]);

  if (!contact) return <Redirect href="/(tabs)" />;
  const balance = summary?.balance ?? 0;
  const balanceColor = balance > 0 ? colors.gave : balance < 0 ? colors.got : colors.muted;

  const actions = (
    <View style={{ flexDirection: 'row', gap: space.lg }}>
      <Pressable accessibilityRole="button" onPress={() => router.push(`/contact/${id}/edit`)}>
        <Text style={s.headerAction}>Tahrirlash</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          confirm(
            `${contact.name} o‘chirilsinmi?`,
            `Kontakt va uning ${rows.length} ta yozuvi o‘chadi. Buni qaytarib bo‘lmaydi.`,
            'O‘chirish',
            () => {
              router.back();
              deleteContact(id);
            },
          )
        }
      >
        <Text style={[s.headerAction, { color: colors.gave }]}>O‘chirish</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <Stack.Screen options={{ title: contact.name, headerRight: () => actions }} />
      <FlatList
        data={rows}
        keyExtractor={(r) => r.tx.id}
        contentContainerStyle={{ padding: space.lg, gap: space.sm }}
        ListHeaderComponent={
          <View style={s.header}>
            <View style={styles.row}>
              <Avatar name={contact.name} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{contact.name}</Text>
                <Text style={styles.muted}>
                  {contact.kind === 'customer' ? 'Mijoz' : 'Ta’minotchi'}
                  {contact.phone ? ` · ${formatPhone(contact.phone)}` : ''}
                </Text>
                {contact.note ? <Text style={styles.muted}>{contact.note}</Text> : null}
              </View>
            </View>
            <View style={[s.balance, { borderColor: balanceColor }]}>
              <Text style={styles.muted}>{balanceLabel(balance, contact.kind)}</Text>
              <Text style={[s.balanceValue, { color: balanceColor }]} testID="contact-balance">
                {formatMoney(Math.abs(balance))}
              </Text>
              {summary?.nextDue ? <DueBadge dueDate={summary.nextDue} /> : null}
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {contact.phone ? (
                <Button
                  variant="secondary"
                  title="Qo‘ng‘iroq"
                  style={{ flex: 1 }}
                  onPress={() => Linking.openURL(`tel:+998${contact.phone}`)}
                />
              ) : null}
              {balance > 0 ? (
                <Button variant="secondary" title="Eslatma" style={{ flex: 1 }} onPress={() => router.push(`/contact/${id}/remind`)} />
              ) : null}
            </View>
            {rows.length > 0 ? <Text style={[styles.muted, { marginTop: space.sm }]}>Tarix · {rows.length} ta yozuv</Text> : null}
          </View>
        }
        renderItem={({ item }) => <TxRow tx={item.tx} balanceAfter={item.balanceAfter} onPress={() => router.push(`/tx/${item.tx.id}`)} />}
        ListEmptyComponent={
          <EmptyState title="Hali yozuv yo‘q" body="Pastdagi tugmalar bilan birinchi qarz yoki to‘lovni yozing." />
        }
      />
      <View style={s.footer}>
        <Button variant="gave" title="↑ Berdim" style={{ flex: 1 }} testID="btn-gave" onPress={() => router.push(`/contact/${id}/tx?type=gave`)} />
        <Button variant="got" title="↓ Oldim" style={{ flex: 1 }} testID="btn-got" onPress={() => router.push(`/contact/${id}/tx?type=got`)} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { gap: space.md, marginBottom: space.sm },
  name: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  balance: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: 4, borderLeftWidth: 4 },
  balanceValue: { fontSize: font.xxl, fontWeight: '900' },
  footer: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.lg,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  headerAction: { color: colors.primary, fontWeight: '700', fontSize: font.md },
});
