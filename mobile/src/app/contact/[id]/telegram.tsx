import { Redirect, useLocalSearchParams } from 'expo-router';
import { backendEnabled } from '../../../lib/backend';
import { useContact } from '../../../lib/store';
import { TelegramLink } from '../../../ui/TelegramLink';

export default function ContactTelegram() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contact = useContact(id);
  if (!contact || !backendEnabled) return <Redirect href="/(tabs)" />;
  return <TelegramLink contact={contact} />;
}
