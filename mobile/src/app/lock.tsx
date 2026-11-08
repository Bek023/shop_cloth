import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { requestCode } from '../lib/auth';
import { friendlyError } from '../lib/backend';
import { useStore } from '../lib/store';
import { Button, Screen, styles } from '../ui/kit';
import { PIN_LENGTH, PinDots, PinPad } from '../ui/PinPad';
import { colors, space } from '../ui/theme';

export default function Lock() {
  const profile = useStore((s) => s.profile);
  const unlock = useStore((s) => s.unlock);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>();

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
  const forgot = async () => {
    if (!profile || busy) return;
    setBusy(true);
    try {
      await requestCode(profile.phone);
      // The PIN is cleared only after the code is verified (see verifyCode).
      useStore.setState({ resetPinRequested: true });
      router.push('/otp');
    } catch (e) {
      setNotice(friendlyError(e));
      setBusy(false);
    }
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
        loading={busy}
      />
      {notice ? <Text style={[styles.muted, { textAlign: 'center', color: colors.gave }]}>{notice}</Text> : null}
    </Screen>
  );
}
