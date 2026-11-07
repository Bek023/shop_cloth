import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { formatDate, formatDateTime } from '../../lib/dates';
import { formatMoney } from '../../lib/money';
import { useStore, useSummaries } from '../../lib/store';
import { confirm } from '../../ui/confirm';
import { Button, Card, Screen, styles } from '../../ui/kit';
import { TxForm } from '../../ui/TxForm';
import { colors, font, space } from '../../ui/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between' }]}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.body, { flexShrink: 1, textAlign: 'right' }]}>{value}</Text>
    </View>
  );
}

export default function TxDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tx = useStore((s) => s.txs[id]);
  const contact = useStore((s) => (tx ? s.contacts[tx.contactId] : undefined));
  const updateTx = useStore((s) => s.updateTx);
  const deleteTx = useStore((s) => s.deleteTx);
  const balance = useSummaries()[tx?.contactId ?? '']?.balance ?? 0;
  const [editing, setEditing] = useState(false);

  if (!tx || tx.deletedAt || !contact) return <Redirect href="/(tabs)" />;
  const gave = tx.type === 'gave';

  if (editing) {
    return (
      <>
        <Stack.Screen options={{ title: 'Tahrirlash' }} />
        <TxForm
          type={tx.type}
          contactName={contact.name}
          currentBalance={balance}
          initial={{ amount: tx.amount, note: tx.note, dueDate: tx.dueDate }}
          submitLabel="Saqlash"
          onSubmit={(d) => {
            updateTx(tx.id, { amount: d.amount, note: d.note?.trim() || undefined, dueDate: d.dueDate });
            setEditing(false);
          }}
        />
      </>
    );
  }

  return (
    <Screen
      footer={
        <>
          <Button variant="secondary" title="Tahrirlash" onPress={() => setEditing(true)} />
          <Button
            variant="danger"
            title="O‘chirish"
            testID="tx-delete"
            onPress={() =>
              confirm('Yozuv o‘chirilsinmi?', `${formatMoney(tx.amount)} — ${contact.name}`, 'O‘chirish', () => {
                deleteTx(tx.id);
                router.back();
              })
            }
          />
        </>
      }
    >
      <Card style={{ gap: space.sm, alignItems: 'center' }}>
        <Text style={styles.muted}>{gave ? 'Berdim' : 'Oldim'}</Text>
        <Text style={{ fontSize: font.xxl, fontWeight: '900', color: gave ? colors.gave : colors.got }}>{formatMoney(tx.amount)}</Text>
        <Text style={styles.body}>{contact.name}</Text>
      </Card>
      <Card style={{ gap: space.md }}>
        <Row label="Sana" value={formatDateTime(tx.occurredAt)} />
        {tx.note ? <Row label="Izoh" value={tx.note} /> : null}
        {gave && tx.dueDate ? <Row label="Qaytarish muddati" value={formatDate(tx.dueDate)} /> : null}
        {tx.updatedAt !== tx.createdAt ? <Row label="Tahrirlangan" value={formatDateTime(tx.updatedAt)} /> : null}
      </Card>
    </Screen>
  );
}
