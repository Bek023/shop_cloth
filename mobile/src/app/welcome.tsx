import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Screen, styles } from '../ui/kit';
import { APP_NAME, colors, font, space } from '../ui/theme';

const POINTS = [
  ['Qarzni 3 bosishda yozing', 'Mijozni tanlang, summani kiriting, tamom.'],
  ['Internetsiz ham ishlaydi', 'Barcha yozuvlar telefoningizda saqlanadi.'],
  ['Muddatni unutmang', 'Kim, qachon to‘lashi kerakligi bir joyda.'],
];

export default function Welcome() {
  return (
    <Screen edges={['top', 'bottom']} footer={<Button title="Boshlash" onPress={() => router.push('/login')} />}>
      <View style={{ flex: 1, justifyContent: 'center', gap: space.xl }}>
        <View style={{ gap: space.sm }}>
          <Text style={{ fontSize: 40, fontWeight: '900', color: colors.primary }}>{APP_NAME}</Text>
          <Text style={{ fontSize: font.xl, fontWeight: '700', color: colors.text }}>
            Do‘koningiz uchun raqamli qarz daftari
          </Text>
        </View>
        <View style={{ gap: space.lg }}>
          {POINTS.map(([title, body]) => (
            <View key={title} style={[styles.row, { alignItems: 'flex-start' }]}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: font.lg, fontWeight: '700', color: colors.text }}>{title}</Text>
                <Text style={styles.muted}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
