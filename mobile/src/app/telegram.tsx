import { Redirect } from 'expo-router';
import { backendEnabled } from '../lib/backend';
import { TelegramLink } from '../ui/TelegramLink';

/** Owner links their own Telegram for the morning digest. */
export default function OwnerTelegram() {
  if (!backendEnabled) return <Redirect href="/(tabs)" />;
  return <TelegramLink />;
}
