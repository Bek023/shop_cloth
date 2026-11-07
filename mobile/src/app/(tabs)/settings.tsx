import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatPhone } from '../../lib/money';
import { useStore } from '../../lib/store';
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
  const profile = useStore((s) => s.profile);
  const pin = useStore((s) => s.pin);
  const contactCount = useStore((s) => Object.keys(s.contacts).length);
  const setPin = useStore((s) => s.setPin);

  return (
    <Screen edges={[]}>
      <SectionTitle>Do‘kon</SectionTitle>
      <Card style={s.group}>
        <Item label="Do‘kon nomi" value={profile?.shopName} onPress={() => router.push('/shop')} />
        <Item label="Telefon" value={profile ? formatPhone(profile.phone) : ''} />
        <Item label="Kontaktlar" value={String(contactCount)} />
      </Card>

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

      <SectionTitle>Ma’lumotlar</SectionTitle>
      <Card style={s.group}>
        <Item label="Saqlash joyi" value="Faqat shu telefonda (bulutga zaxira keyingi bosqichda)" />
      </Card>

      <Card style={s.group}>
        <Item
          label="Chiqish va ma’lumotlarni o‘chirish"
          danger
          onPress={() =>
            confirm(
              'Chiqilsinmi?',
              'Hozircha ma’lumotlar faqat shu telefonda. Chiqsangiz, barcha mijozlar va yozuvlar o‘chadi.',
              'Chiqish',
              () => {
                useStore.getState().signOut();
                router.replace('/welcome');
              },
            )
          }
        />
      </Card>

      <View style={{ alignItems: 'center', marginTop: space.lg }}>
        <Text style={[styles.muted, { fontSize: font.sm }]}>{APP_NAME} · 1.0.0</Text>
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
