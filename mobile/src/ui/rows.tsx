import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dueStatus, type Contact, type ContactSummary, type Tx } from '../lib/ledger';
import { formatMoney, formatPhone } from '../lib/money';
import { formatDate, formatDateTime } from '../lib/dates';
import { Avatar, Badge } from './kit';
import { colors, font, radius, space } from './theme';

export function BalanceText({ balance, size = font.md }: { balance: number; size?: number }) {
  const color = balance > 0 ? colors.gave : balance < 0 ? colors.got : colors.muted;
  return <Text style={{ color, fontSize: size, fontWeight: '800' }}>{formatMoney(Math.abs(balance))}</Text>;
}

/** What a balance means, from the shop owner's side. */
export function balanceLabel(balance: number, kind: Contact['kind']): string {
  if (balance === 0) return 'Hisob teng';
  if (balance > 0) return kind === 'customer' ? 'Qarzi bor' : 'Olishim kerak';
  return kind === 'customer' ? 'Oldindan to‘lagan' : 'Berishim kerak';
}

export function DueBadge({ dueDate }: { dueDate: string }) {
  const s = dueStatus(dueDate);
  if (s === 'overdue') return <Badge tone="gave" label={`Muddati o‘tgan · ${formatDate(dueDate)}`} />;
  if (s === 'today') return <Badge tone="warn" label="Bugun to‘lashi kerak" />;
  if (s === 'soon') return <Badge tone="warn" label={`Muddat: ${formatDate(dueDate)}`} />;
  return <Badge tone="muted" label={`Muddat: ${formatDate(dueDate)}`} />;
}

export function ContactRow({
  contact,
  summary,
  onPress,
}: {
  contact: Contact;
  summary?: ContactSummary;
  onPress: () => void;
}) {
  const balance = summary?.balance ?? 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${contact.name}, ${balanceLabel(balance, contact.kind)} ${formatMoney(Math.abs(balance))}`}
      style={({ pressed }) => [rowStyles.row, pressed && { backgroundColor: colors.bg }]}
    >
      <Avatar name={contact.name} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={rowStyles.name} numberOfLines={1}>
          {contact.name}
        </Text>
        <Text style={rowStyles.sub} numberOfLines={1}>
          {contact.phone ? formatPhone(contact.phone) : 'Telefon kiritilmagan'}
        </Text>
        {summary?.nextDue ? <DueBadge dueDate={summary.nextDue} /> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <BalanceText balance={balance} />
        <Text style={rowStyles.sub}>{balanceLabel(balance, contact.kind)}</Text>
      </View>
    </Pressable>
  );
}

export function TxRow({ tx, balanceAfter, onPress }: { tx: Tx; balanceAfter: number; onPress: () => void }) {
  const gave = tx.type === 'gave';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [rowStyles.row, pressed && { backgroundColor: colors.bg }]}
    >
      <View style={[rowStyles.typeDot, { backgroundColor: gave ? colors.gaveSoft : colors.gotSoft }]}>
        <Text style={{ color: gave ? colors.gave : colors.got, fontWeight: '800', fontSize: font.lg }}>{gave ? '↑' : '↓'}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={rowStyles.name}>{gave ? 'Berdim' : 'Oldim'}</Text>
        <Text style={rowStyles.sub} numberOfLines={1}>
          {formatDateTime(tx.occurredAt)}
          {tx.note ? ` · ${tx.note}` : ''}
        </Text>
        {gave && tx.dueDate ? <DueBadge dueDate={tx.dueDate} /> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={{ color: gave ? colors.gave : colors.got, fontWeight: '800', fontSize: font.md }}>
          {formatMoney(tx.amount)}
        </Text>
        <Text style={rowStyles.sub}>Qoldiq: {formatMoney(balanceAfter)}</Text>
      </View>
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
  },
  name: { fontSize: font.md, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.muted },
  typeDot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
