import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { deleteAccount, signOut } from '../../lib/auth';
import { backendEnabled, friendlyError, TELEGRAM_BOT } from '../../lib/backend';
import { formatDateTime } from '../../lib/dates';
import { formatPhone } from '../../lib/money';
import { useContacts, useStore } from '../../lib/store';
import { syncNow } from '../../lib/sync';
import { confirm } from '../../ui/confirm';
import { Card, Screen, SectionTitle, styles } from '../../ui/kit';
import { APP_NAME, colors, font, space } from '../../ui/theme';

function Item({ label, value, onPress, danger }: { label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} style={s.item}>
      <Text style={[styles.body, danger && { color: colors.gave, fontWeight: '700' }]}>{label}</Text>
      {value ? <Text style={styles.muted}>{value}</Text> : null}
    </Pressable>
  );
}

export default function Settings() {
  const profile = useStore((st) => st.profile);
  const pin = useStore((st) => st.pin);
  const setPin = useStore((st) => st.setPin);
  const syncing = useStore((st) => st.syncing);
  const syncError = useStore((st) => st.syncError);
  const lastSyncAt = useStore((st) => st.lastSyncAt);
  const pending = useStore((st) => Object.keys(st.dirty).length);
  const contactCount = Object.keys(useContacts()).length;
  const [error, setError] = useState<string>();

  const syncLabel = !backendEnabled
    ? 'Faqat shu telefonda (demo rejim)'
    : syncing
      ? 'Sinxronlanmoqda…'
      : syncError
        ? 'Sinxronlab bo‘lmadi. Internetni tekshiring.'
        : pending > 0
          ? `${pending} ta o‘zgarish yuborilmagan`
          : lastSyncAt
            ? `Bulutda saqlangan · ${formatDateTime(lastSyncAt)}`
            : 'Hali sinxronlanmagan';

  return (
    <Screen edges={[]}>
      <SectionTitle>Do‘kon</SectionTitle>
      <Card style={s.group}>
        <Item label="Do‘kon nomi" value={profile?.shopName} onPress={() => router.push('/shop')} />
        <Item label="Telefon" value={profile ? formatPhone(profile.phone) : ''} />
        <Item label="Kontaktlar" value={String(contactCount)} />
      </Card>

      <SectionTitle>Ma’lumotlar</SectionTitle>
      <Card style={s.group}>
        <Item label="Saqlash" value={syncLabel} onPress={backendEnabled ? () => syncNow() : undefined} />
      </Card>

      {backendEnabled && TELEGRAM_BOT ? (
        <>
          <SectionTitle>Telegram</SectionTitle>
          <Card style={s.group}>
            <Item label="Kunlik hisobotni Telegram’da olish" value="Har kuni 9:00 da muddati kelgan qarzlar" onPress={() => router.push('/telegram')} />
          </Card>
        </>
      ) : null}

      <SectionTitle>Xavfsizlik</SectionTitle>
      <Card style={s.group}>
        <Item label={pin ? 'PIN kodni o‘zgartirish' : 'PIN kod o‘rnatish'} value={pin ? 'Yoqilgan' : 'O‘chiq'} onPress={() => router.push('/pin?from=settings')} />
        {pin ? (
          <Item
            label="PIN kodni o‘chirish"
            onPress={() => confirm('PIN o‘chirilsinmi?', 'Ilova kod so‘ramasdan ochiladi.', 'O‘chirish', () => setPin(null))}
          />
        ) : null}
      </Card>

      <Card style={s.group}>
        <Item
          label={backendEnabled ? 'Chiqish' : 'Chiqish va ma’lumotlarni o‘chirish'}
          danger
          onPress={() =>
            confirm(
              'Chiqilsinmi?',
              backendEnabled
                ? pending > 0
                  ? `${pending} ta o‘zgarish hali bulutga yuborilmagan va yo‘qoladi. Avval internetga ulaning.`
                  : 'Ma’lumotlar bulutda qoladi. Qayta kirsangiz, hammasi qaytadi.'
                : 'Demo rejimda ma’lumotlar faqat shu telefonda. Chiqsangiz, barcha mijozlar va yozuvlar o‘chadi.',
              'Chiqish',
              async () => {
                await signOut();
                router.replace('/welcome');
              },
            )
          }
        />
        {backendEnabled ? (
          <Item
            label="Akkauntni butunlay o‘chirish"
            danger
            onPress={() =>
              confirm(
                'Akkaunt o‘chirilsinmi?',
                'Do‘kon, barcha mijozlar, yozuvlar va Telegram ulanishlari serverdan butunlay o‘chiriladi. Buni qaytarib bo‘lmaydi.',
                'O‘chirish',
                async () => {
                  try {
                    await deleteAccount();
                    router.replace('/welcome');
                  } catch (e) {
                    setError(friendlyError(e));
                  }
                },
              )
            }
          />
        ) : null}
      </Card>
      {error ? <Text style={{ color: colors.gave }}>{error}</Text> : null}

      <View style={{ alignItems: 'center', marginTop: space.lg }}>
        <Text style={[styles.muted, { fontSize: font.sm }]}>{APP_NAME} · 1.1.0</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  group: { padding: 0, overflow: 'hidden' },
  item: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
