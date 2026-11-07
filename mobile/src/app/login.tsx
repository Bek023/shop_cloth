import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { formatPhone, isValidPhone, parsePhone } from '../lib/money';
import { useStore } from '../lib/store';
import { Button, Field, Screen, styles } from '../ui/kit';

export default function Login() {
  const startSignIn = useStore((s) => s.startSignIn);
  const [digits, setDigits] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = isValidPhone(digits);

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    startSignIn(digits);
    router.push('/otp');
  };

  return (
    <Screen footer={<Button title="Kod olish" onPress={submit} disabled={!valid} testID="login-submit" />}>
      <Text style={styles.title}>Telefon raqamingiz</Text>
      <Text style={styles.muted}>Raqamingizga tasdiqlash kodi yuboriladi.</Text>
      <Field
        label="Telefon raqam"
        prefix="+998"
        value={formatPhone(digits).replace(/^\+998 ?/, '')}
        onChangeText={(t) => setDigits(parsePhone(t))}
        onBlur={() => setTouched(true)}
        onSubmitEditing={submit}
        keyboardType="phone-pad"
        placeholder="90 123 45 67"
        autoFocus
        error={touched && digits.length > 0 && !valid ? 'Raqam 9 ta raqamdan iborat bo‘lishi kerak' : undefined}
      />
    </Screen>
  );
}
