import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { formatDate } from '../../../lib/dates';
import { formatMoney } from '../../../lib/money';
import { useContact, useStore, useSummaries } from '../../../lib/store';
import { Button, Card, Screen, styles } from '../../../ui/kit';
import { openSms, shareText } from '../../../ui/share';
import { colors, font, radius, space } from '../../../ui/theme';

export function reminderText(p: { name: string; shop: string; amount: number; due?: string }) {
  const due = p.due ? ` To‘lov muddati: ${formatDate(p.due)}.` : '';
  return `Assalomu alaykum, ${p.name}! “${p.shop}” do‘konidan qarzingiz ${formatMoney(p.amount)}.${due} Rahmat!`;
}

/**
 * Manual reminder through the phone's own SMS app or share sheet.
 * Automatic SMS needs a paid SMS provider and comes with the backend.
 */
export default function Remind() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contact = useContact(id);
  const shop = useStore((s) => s.profile?.shopName ?? '');
  const summary = useSummaries()[id];
  const initial = useMemo(
    () => (contact ? reminderText({ name: contact.name, shop, amount: summary?.balance ?? 0, due: summary?.nextDue }) : ''),
    [contact, shop, summary],
  );
  const [text, setText] = useState(initial);
  const [notice, setNotice] = useState<string>();

  if (!contact || !summary || summary.balance <= 0) return <Redirect href="/(tabs)" />;

  const share = async () => setNotice(await shareText(text));

  return (
    <Screen
      footer={
        <>
          {contact.phone ? <Button title="SMS orqali yuborish" onPress={() => openSms(contact.phone!, text)} /> : null}
          <Button variant="secondary" title="Telegram / boshqa ilova orqali" onPress={share} />
        </>
      }
    >
      <Text style={styles.title}>{contact.name}</Text>
      <Text style={styles.muted}>Xabar matnini o‘zgartirishingiz mumkin.</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        accessibilityLabel="Xabar matni"
        style={{
          backgroundColor: colors.card,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: space.md,
          minHeight: 140,
          fontSize: font.md,
          color: colors.text,
          textAlignVertical: 'top',
        }}
      />
      {notice ? (
        <Card>
          <Text style={styles.muted}>{notice}</Text>
        </Card>
      ) : null}
      {!contact.phone ? (
        <Card>
          <Text style={styles.muted}>Bu kontaktda telefon raqam yo‘q. SMS uchun avval raqam qo‘shing.</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
