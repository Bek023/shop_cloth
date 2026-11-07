import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useStore } from '../lib/store';
import { Button, Screen, styles } from '../ui/kit';
import { PIN_LENGTH, PinDots, PinPad } from '../ui/PinPad';
import { space } from '../ui/theme';

/** Set (or change) the local PIN lock. Skippable: the lock is optional. */
export default function SetPin() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const setPin = useStore((s) => s.setPin);
  const [first, setFirst] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [mismatch, setMismatch] = useState(false);

  const done = () => (from === 'settings' ? router.back() : router.replace('/(tabs)'));

  useEffect(() => {
    if (value.length !== PIN_LENGTH) return;
    if (first === null) {
      setFirst(value);
      setValue('');
    } else if (value === first) {
      setPin(value);
      done();
    } else {
      setMismatch(true);
      setFirst(null);
      setValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Screen
      footer={from === 'settings' ? undefined : <Button variant="ghost" title="Hozircha o‘tkazib yuborish" onPress={done} />}
    >
      <View style={{ alignItems: 'center', gap: space.sm, marginTop: space.lg }}>
        <Text style={styles.title}>{first === null ? 'PIN kod o‘rnating' : 'PIN kodni takrorlang'}</Text>
        <Text style={[styles.muted, { textAlign: 'center' }]}>
          {mismatch && first === null
            ? 'Kodlar mos kelmadi. Qaytadan kiriting.'
            : 'Ilova har safar ochilganda shu kod so‘raladi.'}
        </Text>
      </View>
      <PinDots value={value} />
      <PinPad
        value={value}
        onChange={(v) => {
          setMismatch(false);
          setValue(v);
        }}
      />
    </Screen>
  );
}
