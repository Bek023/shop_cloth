import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Platform, Share, Text, TextInput } from 'react-native';
import { formatDate } from '../../../lib/dates';
import { formatMoney } from '../../../lib/money';
import { useStore, useSummaries } from '../../../lib/store';
import { Button, Card, Screen, styles } from '../../../ui/kit';
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
  const contact = useStore((s) => s.contacts[id]);
  const shop = useStore((s) => s.profile?.shopName ?? '');
  const summary = useSummaries()[id];
  const initial = useMemo(
    () => (contact ? reminderText({ name: contact.name, shop, amount: summary?.balance ?? 0, due: summary?.nextDue }) : ''),
    [contact, shop, summary],
  );
  const [text, setText] = useState(initial);
  const [notice, setNotice] = useState<string>();

  if (!contact || !summary || summary.balance <= 0) return <Redirect href="/(tabs)" />;

  const sms = () => {
    const sep = Platform.OS === 'ios' ? '&' : '?';
    Linking.openURL(`sms:+998${contact.phone}${sep}body=${encodeURIComponent(text)}`);
  };

  // Share sheet is missing in some browsers; fall back to copying the text.
  const share = async () => {
    try {
      if (Platform.OS === 'web' && !(globalThis.navigator as Navigator | undefined)?.share) throw new Error('no share');
      await Share.share({ message: text });
    } catch {
      try {
        await globalThis.navigator?.clipboard?.writeText(text);
        setNotice('Matn nusxalandi. Telegram yoki boshqa ilovaga joylang.');
      } catch {
        setNotice('Matnni belgilab, o‘zingiz nusxalang.');
      }
    }
  };

  return (
    <Screen
      footer={
        <>
          {contact.phone ? <Button title="SMS orqali yuborish" onPress={sms} /> : null}
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
