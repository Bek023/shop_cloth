import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Text, type ColorValue } from 'react-native';
import { useStore } from '../../lib/store';
import { colors } from '../../ui/theme';

function Glyph({ char, color }: { char: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color, fontWeight: '700' }}>{char}</Text>;
}

export default function TabsLayout() {
  const profile = useStore((s) => s.profile);
  const pin = useStore((s) => s.pin);
  const unlocked = useStore((s) => s.unlocked);

  // Guard every tab: no profile -> onboarding, PIN set but locked -> lock screen.
  if (!profile) return <Redirect href="/welcome" />;
  if (pin && !unlocked) return <Redirect href="/lock" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { fontWeight: '800' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: profile.shopName || 'Daftar', tabBarLabel: 'Daftar', tabBarIcon: ({ color }) => <Glyph char="☰" color={color} /> }}
      />
      <Tabs.Screen
        name="due"
        options={{ title: 'Muddatlar', tabBarIcon: ({ color }) => <Glyph char="◷" color={color} /> }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: 'Hisobot', tabBarIcon: ({ color }) => <Glyph char="▤" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Sozlamalar', tabBarIcon: ({ color }) => <Glyph char="⚙" color={color} /> }}
      />
    </Tabs>
  );
}
