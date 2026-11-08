import { e164, fetchMyShop, supabase, type ShopRow } from './backend';
import { useStore } from './store';
import { syncNow } from './sync';

/** Demo mode only: no SMS is sent, this code is accepted. */
export const DEMO_CODE = '1234';

export type NextRoute = '/shop' | '/pin' | '/(tabs)';

function nextRoute(): NextRoute {
  if (useStore.getState().resetPinRequested) useStore.setState({ pin: null, resetPinRequested: false });
  const { profile, pin, shopId } = useStore.getState();
  // With the backend, the shop must also exist on the server.
  if (!profile?.shopName || (supabase && !shopId)) return '/shop';
  if (!pin) return '/pin';
  return '/(tabs)';
}

/** Sends the SMS code (or does nothing in demo mode) and remembers the phone for the next screen. */
export async function requestCode(phone9: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.auth.signInWithOtp({ phone: e164(phone9) });
    if (error) throw error;
  }
  useStore.getState().startSignIn(phone9);
}

export async function verifyCode(code: string): Promise<NextRoute> {
  const st = useStore.getState();
  const phone = st.pendingPhone;
  if (!phone) throw new Error('No phone to verify');

  if (!supabase) {
    if (code !== DEMO_CODE) throw new Error('invalid otp');
    st.completeSignIn();
    return nextRoute();
  }

  const { error } = await supabase.auth.verifyOtp({ phone: e164(phone), token: code, type: 'sms' });
  if (error) throw error;
  const shop = await fetchMyShop();
  st.signedIn({ phone, shop });
  if (shop) await syncNow();
  return nextRoute();
}

/** Saves the shop name. With the backend, the first save creates the shop on the server. */
export async function saveShop(shopName: string, ownerName: string): Promise<void> {
  const st = useStore.getState();
  st.saveProfile({ shopName, ownerName });
  if (!supabase) return;
  if (!st.shopId) {
    const { data, error } = await supabase.rpc('bootstrap_shop', { p_name: shopName.trim(), p_owner_name: ownerName.trim() || null });
    if (error) throw error;
    useStore.getState().setShop(data as ShopRow);
    void syncNow();
  } else {
    const { error } = await supabase.from('shops').update({ name: shopName.trim(), owner_name: ownerName.trim() || null }).eq('id', st.shopId);
    if (error) throw error;
  }
}

/** Signs out on every device and clears this phone. Unsynced changes are lost. */
export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut({ scope: 'global' }).catch(() => undefined);
  useStore.getState().signOut();
}

/** Deletes the account and every shop it owns on the server, then clears this phone. */
export async function deleteAccount(): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }
  useStore.getState().signOut();
}

/** One-time Telegram link for a customer (contactId) or for the owner's daily digest (null). */
export async function createTelegramLink(contactId: string | null): Promise<string> {
  const { shopId } = useStore.getState();
  if (!supabase || !shopId) throw new Error('backend not configured');
  await syncNow(); // the contact must exist on the server first
  const { data, error } = await supabase.rpc('create_link_token', { p_shop: shopId, p_contact: contactId });
  if (error) throw error;
  return data as string;
}

export async function isTelegramLinked(contactId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.from('telegram_links').select('contact_id').eq('contact_id', contactId).maybeSingle();
  return !!data;
}
