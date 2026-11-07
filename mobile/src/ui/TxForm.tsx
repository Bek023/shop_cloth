import { useState } from 'react';
import { Text, View } from 'react-native';
import { addDays, todayISODate, type TxType } from '../lib/ledger';
import { formatAmountInput, formatMoney, parseAmount } from '../lib/money';
import { formatDate } from '../lib/dates';
import { Button, Chip, Field, Screen, styles } from './kit';
import { colors, space } from './theme';

export type TxDraft = { amount: number; note?: string; dueDate?: string };

const DUE_OPTIONS: { label: string; days: number | null }[] = [
  { label: 'Muddatsiz', days: null },
  { label: '3 kun', days: 3 },
  { label: '1 hafta', days: 7 },
  { label: '2 hafta', days: 14 },
  { label: '1 oy', days: 30 },
];

export function TxForm({
  type,
  contactName,
  currentBalance,
  initial,
  submitLabel,
  onSubmit,
}: {
  type: TxType;
  contactName: string;
  currentBalance: number;
  initial?: TxDraft;
  submitLabel: string;
  onSubmit: (d: TxDraft) => void;
}) {
  const [amountText, setAmountText] = useState(initial ? formatAmountInput(String(initial.amount)) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [dueDate, setDueDate] = useState<string | undefined>(initial?.dueDate);
  const amount = parseAmount(amountText);
  const gave = type === 'gave';
  const delta = initial ? amount - initial.amount : amount;
  const after = currentBalance + (gave ? delta : -delta);
  const today = todayISODate();

  const submit = () => {
    if (amount <= 0) return;
    onSubmit({ amount, note, dueDate: gave ? dueDate : undefined });
  };

  return (
    <Screen
      footer={
        <Button variant={gave ? 'gave' : 'got'} title={submitLabel} onPress={submit} disabled={amount <= 0} testID="tx-submit" />
      }
    >
      <Text style={[styles.title, { color: gave ? colors.gave : colors.got }]}>
        {gave ? `${contactName}ga berdim` : `${contactName}dan oldim`}
      </Text>
      <Field
        label="Summa"
        value={amountText}
        onChangeText={(t) => setAmountText(formatAmountInput(t))}
        keyboardType="number-pad"
        placeholder="0"
        autoFocus
        big
        hint={amount > 0 ? `Keyin qoldiq: ${formatMoney(Math.abs(after))}${after < 0 ? ' (oldindan to‘lov)' : ''}` : undefined}
        testID="tx-amount"
      />
      <Field
        label="Izoh (ixtiyoriy)"
        value={note}
        onChangeText={setNote}
        placeholder={gave ? 'Masalan: 2 qop un, 5 l yog‘' : 'Masalan: naqd, karta orqali'}
        maxLength={200}
      />
      {gave ? (
        <View style={{ gap: space.sm }}>
          <Text style={styles.muted}>Qaytarish muddati</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {DUE_OPTIONS.map((o) => {
              const value = o.days === null ? undefined : addDays(today, o.days);
              return <Chip key={o.label} label={o.label} active={dueDate === value} onPress={() => setDueDate(value)} />;
            })}
          </View>
          {dueDate ? <Text style={styles.muted}>Muddat: {formatDate(dueDate)}</Text> : null}
        </View>
      ) : null}
    </Screen>
  );
}
