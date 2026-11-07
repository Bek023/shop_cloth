import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useStore } from '../lib/store';
import { Button, Screen, styles } from '../ui/kit';
import { PIN_LENGTH, PinDots, PinPad } from '../ui/PinPad';
import { colors, space } from '../ui/theme';

export default function Lock() {
  const profile = useStore((s) => s.profile);
  const unlock = useStore((s) => s.unlock);
  const startSignIn = useStore((s) => s.startSignIn);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (value.length !== PIN_LENGTH) return;
    if (unlock(value)) {
      router.replace('/(tabs)');
    } else {
      setError(true);
      setAttempts((a) => a + 1);
      setValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Forgot PIN: prove you own the number again (same SMS flow), data stays on the phone.
  const forgot = () => {
    if (!profile) return;
    useStore.getState().setPin(null);
    useStore.getState().lock();
    startSignIn(profile.phone);
    router.replace('/otp');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ alignItems: 'center', gap: space.sm, marginTop: space.xxl }}>
        <Text style={styles.title}>{profile?.shopName}</Text>
        <Text style={[styles.muted, error && { color: colors.gave }]}>
          {error ? 'PIN noto‘g‘ri' : 'PIN kodni kiriting'}
        </Text>
      </View>
      <PinDots value={value} error={error} />
      <PinPad
        value={value}
        onChange={(v) => {
          setError(false);
          setValue(v);
        }}
      />
      <Button
        variant="ghost"
        title={attempts >= 3 ? 'PIN kodni unutdingizmi? SMS orqali tiklash' : 'PIN kodni unutdim'}
        onPress={forgot}
      />
    </Screen>
  );
}
