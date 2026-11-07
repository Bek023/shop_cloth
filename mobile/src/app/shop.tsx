import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { useStore } from '../lib/store';
import { Button, Field, Screen, styles } from '../ui/kit';

export default function ShopSetup() {
  const profile = useStore((s) => s.profile);
  const saveProfile = useStore((s) => s.saveProfile);
  const [shopName, setShopName] = useState(profile?.shopName ?? '');
  const [ownerName, setOwnerName] = useState(profile?.ownerName ?? '');

  if (!profile) return <Redirect href="/welcome" />;
  const valid = shopName.trim().length >= 2;

  const submit = () => {
    if (!valid) return;
    const editing = !!profile.shopName;
    saveProfile({ shopName, ownerName });
    if (editing && router.canGoBack()) return router.back();
    router.replace(useStore.getState().pin ? '/(tabs)' : '/pin');
  };

  return (
    <Screen footer={<Button title="Davom etish" onPress={submit} disabled={!valid} testID="shop-submit" />}>
      <Text style={styles.title}>Do‘koningiz haqida</Text>
      <Text style={styles.muted}>Bu nom mijozlarga yuboriladigan eslatmalarda ko‘rinadi.</Text>
      <Field label="Do‘kon nomi" value={shopName} onChangeText={setShopName} placeholder="Masalan: Baraka savdo" autoFocus maxLength={60} />
      <Field label="Ismingiz (ixtiyoriy)" value={ownerName} onChangeText={setOwnerName} placeholder="Masalan: Akmal" maxLength={60} />
    </Screen>
  );
}
