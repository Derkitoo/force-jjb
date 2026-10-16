import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useStore } from '@/lib/store';
import { useColors } from '@/theme';

const icon = (glyph: string) => ({ color }: { color: string }) => <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;

export default function TabsLayout() {
  const c = useColors();
  const program = useStore((s) => s.program);
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  useEffect(() => useStore.persist.onFinishHydration(() => setHydrated(true)), []);
  if (!hydrated) return null; // attend la lecture du stockage local
  if (!program) return <Redirect href="/onboarding" />;
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: c.accent,
      tabBarInactiveTintColor: c.muted,
      tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line },
    }}>
      <Tabs.Screen name="index" options={{ title: "Aujourd'hui", tabBarIcon: icon('●') }} />
      <Tabs.Screen name="jjb" options={{ title: 'Jiu-jitsu', tabBarIcon: icon('▬') }} />
      <Tabs.Screen name="progres" options={{ title: 'Progrès', tabBarIcon: icon('▲') }} />
    </Tabs>
  );
}
