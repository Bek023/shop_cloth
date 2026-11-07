import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { formatPhone } from '../lib/money';
import { useStore } from '../lib/store';
import { Button, Card, Field, Screen, styles } from '../ui/kit';

// Demo mode: there is no SMS backend yet, so one fixed code is accepted.
// Replaced by a real provider in /replica-backend.
export const DEMO_CODE = '1234';
const RESEND_SECONDS = 60;

export default function Otp() {
  const pendingPhone = useStore((s) => s.pendingPhone);
  const completeSignIn = useStore((s) => s.completeSignIn);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [left, setLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  if (!pendingPhone) return <Redirect href="/login" />;

  const submit = (value = code) => {
    if (value !== DEMO_CODE) {
      setError('Kod noto‘g‘ri. Qaytadan urinib ko‘ring.');
      return;
    }
    const result = completeSignIn();
    const { profile, pin } = useStore.getState();
    if (result === 'new' || !profile?.shopName) router.replace('/shop');
    else if (!pin) router.replace('/pin');
    else router.replace('/(tabs)');
  };

  return (
    <Screen footer={<Button title="Tasdiqlash" onPress={() => submit()} disabled={code.length !== 4} testID="otp-submit" />}>
      <Text style={styles.title}>SMS kod</Text>
      <Text style={styles.muted}>{formatPhone(pendingPhone)} raqamiga 4 xonali kod yuborildi.</Text>
      <Field
        label="Kod"
        value={code}
        onChangeText={(t) => {
          const v = t.replace(/\D/g, '').slice(0, 4);
          setCode(v);
          setError(undefined);
          if (v.length === 4) submit(v);
        }}
        keyboardType="number-pad"
        placeholder="••••"
        autoFocus
        big
        maxLength={4}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        error={error}
      />
      <Card>
        <Text style={styles.muted}>Demo rejim: SMS hali ulanmagan. Kod: {DEMO_CODE}</Text>
      </Card>
      <Button
        variant="ghost"
        title={left > 0 ? `Qayta yuborish (${left} s)` : 'Kodni qayta yuborish'}
        disabled={left > 0}
        onPress={() => setLeft(RESEND_SECONDS)}
      />
    </Screen>
  );
}
