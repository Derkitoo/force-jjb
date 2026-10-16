import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/theme';

export function Screen({ children, bottomPad = 24 }: { children: ReactNode; bottomPad?: number }) {
  const c = useColors();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad, gap: 14 }}>{children}</ScrollView>
    </SafeAreaView>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: c.ink, fontSize: 30, fontWeight: '800', textTransform: 'uppercase' }}>{children}</Text>
      {sub ? <Text style={{ color: c.muted, fontSize: 15 }}>{sub}</Text> : null}
    </View>
  );
}

export function Card({ children, style, accent }: { children: ReactNode; style?: ViewStyle; accent?: string }) {
  const c = useColors();
  return (
    <View style={[s.card, { backgroundColor: c.surface, borderColor: c.line }, accent ? { borderLeftWidth: 6, borderLeftColor: accent } : null, style]}>
      {children}
    </View>
  );
}

export function Button({ label, onPress, kind = 'primary', disabled }: { label: string; onPress: () => void; kind?: 'primary' | 'ghost'; disabled?: boolean }) {
  const c = useColors();
  const primary = kind === 'primary';
  return (
    <Pressable
      accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={({ pressed }) => [s.btn, { backgroundColor: primary ? c.accent : c.surface, borderColor: primary ? c.accent : c.line, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}
    >
      <Text style={{ color: primary ? c.onAccent : c.ink, fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress}
      style={[s.chip, { backgroundColor: active ? c.ink : c.chip }]}>
      <Text style={{ color: active ? c.bg : c.ink, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Label({ children }: { children: ReactNode }) {
  const c = useColors();
  return <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>{children}</Text>;
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  btn: { borderWidth: 1, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  chip: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
});
