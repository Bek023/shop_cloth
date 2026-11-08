import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Public values only: the anon key is meant to ship in the app; RLS protects the data.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Telegram bot username without "@", for deep links. */
export const TELEGRAM_BOT = process.env.EXPO_PUBLIC_TELEGRAM_BOT ?? '';

/** null means demo mode: no server, everything stays on the phone. */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : null;

export const backendEnabled = supabase !== null;

/** Length of the SMS code: Supabase sends 6 digits, demo mode uses 4. */
export const OTP_LENGTH = backendEnabled ? 6 : 4;

export function e164(phone9: string): string {
  return `+998${phone9}`;
}

export type ShopRow = { id: string; name: string; owner_name: string | null };

/** The signed-in user's shop, or null if they have not created one yet. */
export async function fetchMyShop(): Promise<ShopRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('shops').select('id, name, owner_name').order('created_at').limit(1);
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}

/** Turns Supabase errors into short Uzbek messages for the screen. */
export function friendlyError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/rate limit|too many/i.test(m)) return 'Juda ko‘p urinish. Birozdan keyin qayta urinib ko‘ring.';
  if (/expired|invalid.*(otp|token)|token.*(expired|invalid)/i.test(m)) return 'Kod noto‘g‘ri yoki muddati o‘tgan.';
  if (/network|fetch|failed to fetch/i.test(m)) return 'Internet bilan aloqa yo‘q. Qayta urinib ko‘ring.';
  if (/sms|phone provider/i.test(m)) return 'SMS yuborib bo‘lmadi. Server sozlamalarini tekshiring.';
  return 'Xatolik yuz berdi. Qayta urinib ko‘ring.';
}
