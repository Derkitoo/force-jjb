import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { askPermission } from '@/lib/notifications';
import { initPurchases } from '@/lib/purchases';
import { supabase } from '@/lib/supabase';
import { flushQueue, refreshPremium } from '@/lib/sync';

export default function RootLayout() {
  useEffect(() => {
    askPermission().catch(() => {});
    if (!supabase) { initPurchases().catch(() => {}); return; }
    supabase.auth.getSession().then(({ data }) => {
      initPurchases(data.session?.user.id).catch(() => {});
      flushQueue().catch(() => {});
      refreshPremium().catch(() => {});
    });
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="session/[key]" options={{ presentation: 'card' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
