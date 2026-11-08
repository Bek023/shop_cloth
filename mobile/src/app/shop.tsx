import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { saveShop } from '../lib/auth';
import { backendEnabled, friendlyError } from '../lib/backend';
import { useStore } from '../lib/store';
import { Button, Field, Screen, styles } from '../ui/kit';

export default function ShopSetup() {
  const profile = useStore((s) => s.profile);
  const [shopName, setShopName] = useState(profile?.shopName ?? '');
  const [ownerName, setOwnerName] = useState(profile?.ownerName ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (!profile) return <Redirect href="/welcome" />;
  const valid = shopName.trim().length >= 2;

  const submit = async () => {
    if (!valid || busy) return;
    // Opened from Settings to rename: go back. First-time setup: continue onboarding.
    const editing = !!profile.shopName && (!backendEnabled || !!useStore.getState().shopId) && router.canGoBack();
    setBusy(true);
    setError(undefined);
    try {
      await saveShop(shopName, ownerName);
      if (editing) return router.back();
      router.replace(useStore.getState().pin ? '/(tabs)' : '/pin');
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title="Davom etish" onPress={submit} disabled={!valid} loading={busy} testID="shop-submit" />}>
      <Text style={styles.title}>Do‘koningiz haqida</Text>
      <Text style={styles.muted}>Bu nom mijozlarga yuboriladigan eslatmalarda ko‘rinadi.</Text>
      <Field label="Do‘kon nomi" value={shopName} onChangeText={setShopName} placeholder="Masalan: Baraka savdo" autoFocus maxLength={60} error={error} />
      <Field label="Ismingiz (ixtiyoriy)" value={ownerName} onChangeText={setOwnerName} placeholder="Masalan: Akmal" maxLength={60} />
    </Screen>
  );
}
