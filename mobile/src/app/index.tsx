import { Redirect } from 'expo-router';
import { backendEnabled } from '../lib/backend';
import { useStore } from '../lib/store';

/** Decides where a cold start lands. */
export default function Index() {
  const profile = useStore((s) => s.profile);
  const pin = useStore((s) => s.pin);
  const unlocked = useStore((s) => s.unlocked);
  const shopId = useStore((s) => s.shopId);

  if (!profile) return <Redirect href="/welcome" />;
  if (!profile.shopName || (backendEnabled && !shopId)) return <Redirect href="/shop" />;
  if (pin && !unlocked) return <Redirect href="/lock" />;
  return <Redirect href="/(tabs)" />;
}
