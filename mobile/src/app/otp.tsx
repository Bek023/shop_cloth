import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { DEMO_CODE, requestCode, verifyCode } from '../lib/auth';
import { backendEnabled, friendlyError, OTP_LENGTH } from '../lib/backend';
import { formatPhone } from '../lib/money';
import { useStore } from '../lib/store';
import { Button, Card, Field, Screen, styles } from '../ui/kit';

const RESEND_SECONDS = 60;

export default function Otp() {
  // Captured once: verifying clears pendingPhone, which must not bounce this screen back to /login.
  const [pendingPhone] = useState(() => useStore.getState().pendingPhone);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  if (!pendingPhone) return <Redirect href="/login" />;

  const submit = async (value = code) => {
    if (value.length !== OTP_LENGTH || busy) return;
    setBusy(true);
    try {
      router.replace(await verifyCode(value));
    } catch (e) {
      setError(backendEnabled ? friendlyError(e) : 'Kod noto‘g‘ri. Qaytadan urinib ko‘ring.');
      setBusy(false);
    }
  };

  const resend = async () => {
    setLeft(RESEND_SECONDS);
    try {
      await requestCode(pendingPhone);
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  return (
    <Screen
      footer={<Button title="Tasdiqlash" onPress={() => submit()} disabled={code.length !== OTP_LENGTH} loading={busy} testID="otp-submit" />}
    >
      <Text style={styles.title}>SMS kod</Text>
      <Text style={styles.muted}>
        {formatPhone(pendingPhone)} raqamiga {OTP_LENGTH} xonali kod yuborildi.
      </Text>
      <Field
        label="Kod"
        value={code}
        onChangeText={(t) => {
          const v = t.replace(/\D/g, '').slice(0, OTP_LENGTH);
          setCode(v);
          setError(undefined);
          if (v.length === OTP_LENGTH) submit(v);
        }}
        keyboardType="number-pad"
        placeholder={'•'.repeat(OTP_LENGTH)}
        autoFocus
        big
        maxLength={OTP_LENGTH}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        error={error}
      />
      {!backendEnabled ? (
        <Card>
          <Text style={styles.muted}>Demo rejim: SMS hali ulanmagan. Kod: {DEMO_CODE}</Text>
        </Card>
      ) : null}
      <Button
        variant="ghost"
        title={left > 0 ? `Qayta yuborish (${left} s)` : 'Kodni qayta yuborish'}
        disabled={left > 0}
        onPress={resend}
      />
    </Screen>
  );
}
