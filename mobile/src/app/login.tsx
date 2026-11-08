import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { requestCode } from '../lib/auth';
import { friendlyError } from '../lib/backend';
import { formatPhone, isValidPhone, parsePhone } from '../lib/money';
import { Button, Field, Screen, styles } from '../ui/kit';

export default function Login() {
  const [digits, setDigits] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const valid = isValidPhone(digits);

  const submit = async () => {
    setTouched(true);
    if (!valid || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await requestCode(digits);
      router.push('/otp');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title="Kod olish" onPress={submit} disabled={!valid} loading={busy} testID="login-submit" />}>
      <Text style={styles.title}>Telefon raqamingiz</Text>
      <Text style={styles.muted}>Raqamingizga tasdiqlash kodi yuboriladi.</Text>
      <Field
        label="Telefon raqam"
        prefix="+998"
        value={formatPhone(digits).replace(/^\+998 ?/, '')}
        onChangeText={(t) => {
          setDigits(parsePhone(t));
          setError(undefined);
        }}
        onBlur={() => setTouched(true)}
        onSubmitEditing={submit}
        keyboardType="phone-pad"
        placeholder="90 123 45 67"
        autoFocus
        error={error ?? (touched && digits.length > 0 && !valid ? 'Raqam 9 ta raqamdan iborat bo‘lishi kerak' : undefined)}
      />
    </Screen>
  );
}
