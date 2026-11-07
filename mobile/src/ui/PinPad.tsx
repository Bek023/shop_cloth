import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from './theme';

export const PIN_LENGTH = 4;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function PinDots({ value, error }: { value: string; error?: boolean }) {
  return (
    <View style={s.dots} accessibilityLabel={`${value.length} ta raqam kiritildi`}>
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <View
          key={i}
          style={[s.dot, i < value.length && s.dotOn, error && { borderColor: colors.gave, backgroundColor: i < value.length ? colors.gave : 'transparent' }]}
        />
      ))}
    </View>
  );
}

export function PinPad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.pad}>
      {KEYS.map((k, i) =>
        k === '' ? (
          <View key={i} style={s.key} />
        ) : (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={k === '⌫' ? 'O‘chirish' : k}
            onPress={() => {
              if (k === '⌫') onChange(value.slice(0, -1));
              else if (value.length < PIN_LENGTH) onChange(value + k);
            }}
            style={({ pressed }) => [s.key, pressed && { backgroundColor: colors.border }]}
          >
            <Text style={s.keyText}>{k}</Text>
          </Pressable>
        ),
      )}
    </View>
  );
}

const s = StyleSheet.create({
  dots: { flexDirection: 'row', gap: space.lg, justifyContent: 'center', marginVertical: space.xl },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.primary },
  dotOn: { backgroundColor: colors.primary },
  pad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300, alignSelf: 'center' },
  key: { width: 100, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 36 },
  keyText: { fontSize: font.xxl, fontWeight: '600', color: colors.text },
});
