import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { createTelegramLink } from '../lib/auth';
import { friendlyError, TELEGRAM_BOT } from '../lib/backend';
import { useStore } from '../lib/store';
import { Button, Card, Screen, styles } from './kit';
import { openSms, shareText } from './share';
import { colors, font, radius, space } from './theme';

/**
 * Creates a one-time t.me deep link. For a customer (contact given) the link is sent to them;
 * for the owner (no contact) they open it themselves to get the daily digest.
 */
export function TelegramLink({ contact }: { contact?: { id: string; name: string; phone?: string } }) {
  const shop = useStore((s) => s.profile?.shopName ?? '');
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    createTelegramLink(contact?.id ?? null)
      .then((token) => !cancelled && setUrl(`https://t.me/${TELEGRAM_BOT}?start=${token}`))
      .catch((e) => !cancelled && setError(friendlyError(e)));
    return () => {
      cancelled = true;
    };
  }, [contact?.id]);

  const message = contact
    ? `Assalomu alaykum, ${contact.name}! “${shop}” do‘konidagi hisobingizni Telegram'da ko‘rish va eslatma olish uchun shu havolani bosing: ${url}`
    : url ?? '';

  return (
    <Screen
      footer={
        url ? (
          <>
            {contact?.phone ? <Button title="SMS bilan yuborish" onPress={() => openSms(contact.phone!, message)} /> : null}
            <Button variant={contact?.phone ? 'secondary' : 'primary'} title={contact ? 'Havolani ulashish' : 'Havolani nusxalash'} onPress={async () => setNotice(await shareText(message))} />
          </>
        ) : undefined
      }
    >
      <Text style={styles.title}>{contact ? `${contact.name}ni Telegram'ga ulash` : 'Kunlik hisobot Telegram’da'}</Text>
      <Text style={styles.muted}>
        {contact
          ? 'Mijoz havolani bosib, botda “Start” ni bossa, qarz muddati yaqinlashganda unga avtomatik eslatma boradi. Havola 7 kun amal qiladi va bir marta ishlaydi.'
          : 'Havolani telefoningizda oching va botda “Start” ni bosing. Har kuni ertalab 9:00 da muddati kelgan qarzlar ro‘yxati keladi.'}
      </Text>
      <Card style={{ gap: space.sm }}>
        {url ? (
          <Text selectable style={{ fontSize: font.md, color: colors.primaryDark, fontWeight: '600' }} testID="telegram-url">
            {url}
          </Text>
        ) : error ? (
          <Text style={{ color: colors.gave }}>{error}</Text>
        ) : (
          <Text style={styles.muted}>Havola tayyorlanmoqda…</Text>
        )}
      </Card>
      {notice ? (
        <View style={{ backgroundColor: colors.primarySoft, padding: space.md, borderRadius: radius.md }}>
          <Text style={{ color: colors.primaryDark }}>{notice}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
