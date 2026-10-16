import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cancelRest, scheduleRestEnd } from '@/lib/notifications';
import { useColors } from '@/theme';

export interface RestTimerHandle { start: (sec: number) => void }

/** Basé sur une heure de fin (pas un compteur) : reste juste après un passage en arrière-plan. */
export function RestTimer({ onReady }: { onReady: (h: RestTimerHandle) => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [end, setEnd] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);

  const start = (sec: number) => {
    fired.current = false;
    setEnd(Date.now() + sec * 1000);
    scheduleRestEnd(sec).catch(() => {});
  };
  useEffect(() => onReady({ start }), []);

  useEffect(() => {
    if (!end) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [end]);

  const left = end ? Math.max(0, Math.round((end - now) / 1000)) : 0;
  useEffect(() => {
    if (end && left === 0 && !fired.current) {
      fired.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [left, end]);

  const label = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return (
    <View style={[styles.bar, { backgroundColor: c.ink, paddingBottom: 10 + insets.bottom }]}>
      <Text style={[styles.clock, { color: end && left > 0 ? c.belt : end ? c.good : c.bg }]}>{label}</Text>
      {[90, 150, 180].map((s) => (
        <Pressable key={s} onPress={() => start(s)} style={[styles.btn, { borderColor: c.muted }]} accessibilityRole="button">
          <Text style={{ color: c.bg, fontWeight: '600' }}>{s === 90 ? '1:30' : s === 150 ? '2:30' : '3:00'}</Text>
        </Pressable>
      ))}
      <Pressable onPress={() => { setEnd(null); cancelRest(); }} style={[styles.btn, { borderColor: c.muted }]} accessibilityRole="button">
        <Text style={{ color: c.bg, fontWeight: '600' }}>Stop</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  clock: { fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 76, textAlign: 'center' },
  btn: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
});
