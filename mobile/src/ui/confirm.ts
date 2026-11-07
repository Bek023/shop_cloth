import { Alert, Platform } from 'react-native';

/** Destructive confirmation. Alert.alert has no buttons on web, so use window.confirm there. */
export function confirm(title: string, message: string, okLabel: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Bekor qilish', style: 'cancel' },
    { text: okLabel, style: 'destructive', onPress: onOk },
  ]);
}
