import { Linking, Platform, Share } from 'react-native';

/**
 * Opens the share sheet, or copies the text where there is none (some browsers).
 * Returns a message to show when it fell back to copying, or undefined.
 */
export async function shareText(text: string): Promise<string | undefined> {
  try {
    if (Platform.OS === 'web' && !(globalThis.navigator as Navigator | undefined)?.share) throw new Error('no share');
    await Share.share({ message: text });
    return undefined;
  } catch {
    try {
      await globalThis.navigator?.clipboard?.writeText(text);
      return 'Matn nusxalandi. Telegram yoki boshqa ilovaga joylang.';
    } catch {
      return 'Matnni belgilab, o‘zingiz nusxalang.';
    }
  }
}

/** Opens the phone's SMS app with the text filled in. */
export function openSms(phone9: string, text: string) {
  const sep = Platform.OS === 'ios' ? '&' : '?';
  return Linking.openURL(`sms:+998${phone9}${sep}body=${encodeURIComponent(text)}`);
}
