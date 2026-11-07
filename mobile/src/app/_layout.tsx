import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '../lib/store';
import { ConfirmHost } from '../ui/ConfirmHost';
import { colors } from '../ui/theme';

export default function RootLayout() {
  const hydrated = useStore((s) => s.hydrated);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!hydrated ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <Stack
          screenOptions={{
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.card },
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.bg },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: 'Kirish' }} />
          <Stack.Screen name="otp" options={{ title: 'Tasdiqlash' }} />
          <Stack.Screen name="shop" options={{ title: 'Do‘kon', headerBackVisible: false }} />
          <Stack.Screen name="pin" options={{ title: 'PIN kod' }} />
          <Stack.Screen name="lock" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="contact/new" options={{ title: 'Yangi kontakt', presentation: 'modal' }} />
          <Stack.Screen name="contact/[id]/index" options={{ title: '' }} />
          <Stack.Screen name="contact/[id]/edit" options={{ title: 'Tahrirlash', presentation: 'modal' }} />
          <Stack.Screen name="contact/[id]/tx" options={{ title: '', presentation: 'modal' }} />
          <Stack.Screen name="contact/[id]/remind" options={{ title: 'Eslatma yuborish', presentation: 'modal' }} />
          <Stack.Screen name="tx/[id]" options={{ title: 'Yozuv' }} />
        </Stack>
      )}
      <ConfirmHost />
    </SafeAreaProvider>
  );
}
