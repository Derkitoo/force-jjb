import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { RestTimer, type RestTimerHandle } from '@/components/RestTimer';
import { Button, Card, Label, Screen, Title } from '@/components/ui';
import { adjustSession } from '@/domain/adjust';
import type { SessionKey, SetResult } from '@/domain/types';
import { hoursToNextBjj } from '@/domain/schedule';
import { useStore } from '@/lib/store';
import { flushQueue } from '@/lib/sync';
import { todayIndex, useColors } from '@/theme';

export default function SessionScreen() {
  const c = useColors();
  const { key } = useLocalSearchParams<{ key: SessionKey }>();
  const { program, answers, cycleWeek, loads, bjj, setLoad, finishWorkout } = useStore();
  const timer = useRef<RestTimerHandle | null>(null);
  const [startedAt] = useState(new Date().toISOString());
  const [results, setResults] = useState<Record<string, (SetResult | null)[]>>({});
  const [messages, setMessages] = useState<Record<string, string> | null>(null);
  /** charges corrigées pendant la séance (la séance ajustée, elle, reste figée) */
  const [override, setOverride] = useState<Record<string, number>>({});

  const adj = useMemo(() => {
    if (!program || !answers) return null;
    const t = todayIndex();
    return adjustSession(program.sessions[key], {
      now: new Date(), weekInCycle: cycleWeek, cycleLength: program.cycleLength,
      lastBjj: bjj[bjj.length - 1], hoursToNextBjj: hoursToNextBjj(answers.bjjDays),
      openMatTomorrow: program.week.days[(t + 1) % 7].kind === 'openmat', loads,
    });
  }, [key]); // figé au début de la séance
  if (!adj) return null;

  const repsOf = (r: number | [number, number]) => (Array.isArray(r) ? r[1] : r);
  const targetOf = (e: (typeof adj.exercises)[number]) => override[e.id] ?? e.targetLoadKg;
  const bump = (e: (typeof adj.exercises)[number], dir: 1 | -1) => {
    const step = (e.increment || 2.5) * dir;
    setOverride((o) => ({ ...o, [e.id]: Math.max(0, targetOf(e) + step) }));
    setLoad(e.id, (loads[e.id] ?? 0) + step);
  };
  const toggle = (id: string, i: number, load: number, reps: number, rest: number) => {
    const arr = [...(results[id] ?? [])];
    arr[i] = arr[i] ? null : { loadKg: load, reps };
    if (arr[i]) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); timer.current?.start(rest); }
    setResults({ ...results, [id]: arr });
  };
  const editReps = (id: string, i: number, v: string) =>
    setResults((prev) => {
      const arr = [...(prev[id] ?? [])];
      if (arr[i]) arr[i] = { ...arr[i]!, reps: parseInt(v, 10) || 0 };
      return { ...prev, [id]: arr };
    });

  const finish = () => {
    const sets = Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.filter(Boolean) as SetResult[]]));
    const planned = Object.fromEntries(adj.exercises.map((e) => [e.id, e.sets]));
    setMessages(finishWorkout({ id: '', session: key, date: startedAt, deload: adj.deload, reasons: adj.reasons, sets }, planned));
    flushQueue().catch(() => {});
  };

  if (messages) {
    return (
      <Screen>
        <Title sub="Les charges de la prochaine séance sont prêtes.">Séance terminée</Title>
        {adj.exercises.filter((e) => messages[e.id]).map((e) => (
          <Card key={e.id}><Text style={{ color: c.ink, fontWeight: '700' }}>{e.name}</Text><Text style={{ color: c.muted }}>{messages[e.id]}</Text></Card>
        ))}
        <Button label="Retour" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen bottomPad={120}>
        <Title sub={adj.template.focus}>{adj.template.name}</Title>
        {adj.reasons.map((r) => <Text key={r} style={{ color: c.warn, fontWeight: '600' }}>{r}</Text>)}

        {adj.exercises.map((e) => {
          const reps = repsOf(e.reps);
          const res = results[e.id] ?? [];
          return (
            <Card key={e.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ color: c.ink, fontSize: 19, fontWeight: '800', flexShrink: 1 }}>{e.name}</Text>
                <Text style={{ color: c.accent, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                  {e.sets} × {Array.isArray(e.reps) ? `${e.reps[0]}-${e.reps[1]}` : e.reps}
                </Text>
              </View>
              <Text style={{ color: c.muted, fontSize: 13 }}>
                {e.rir === 0 ? "Jusqu'à l'échec" : `Garde ${e.rir} rep${e.rir > 1 ? 's' : ''} en réserve`}{e.note ? ` · ${e.note}` : ''}
              </Text>
              {e.loaded ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pressable onPress={() => bump(e, -1)} style={{ padding: 8 }} accessibilityLabel="Baisser la charge"><Text style={{ color: c.ink, fontSize: 22 }}>−</Text></Pressable>
                  <Text style={{ color: c.ink, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 80, textAlign: 'center' }}>{targetOf(e)} kg</Text>
                  <Pressable onPress={() => bump(e, 1)} style={{ padding: 8 }} accessibilityLabel="Monter la charge"><Text style={{ color: c.ink, fontSize: 22 }}>+</Text></Pressable>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {Array.from({ length: e.sets }, (_, i) => {
                  const done = !!res[i];
                  const top = e.topSet && i === 0;
                  return (
                    <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                      <Pressable
                        onPress={() => toggle(e.id, i, top || !e.topSet ? targetOf(e) : Math.round(targetOf(e) * 0.9 / 2.5) * 2.5, reps, e.restSec)}
                        accessibilityRole="checkbox" accessibilityState={{ checked: done }}
                        style={{ width: 52, height: 52, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
                          borderColor: top ? c.belt : done ? c.ink : c.line, backgroundColor: done ? c.ink : c.bg }}>
                        <Text style={{ color: done ? c.bg : c.ink, fontWeight: '700' }}>{done ? res[i]!.reps : reps}</Text>
                        <Text style={{ color: done ? c.bg : c.muted, fontSize: 10 }}>{top ? 'Lourde' : e.topSet ? '−10 %' : `S${i + 1}`}</Text>
                      </Pressable>
                      {done ? (
                        <TextInput defaultValue={String(res[i]!.reps)} onChangeText={(v) => editReps(e.id, i, v)} keyboardType="number-pad"
                          accessibilityLabel="Répétitions réalisées"
                          style={{ width: 52, textAlign: 'center', borderBottomWidth: 1, borderColor: c.line, color: c.ink, paddingVertical: 2 }} />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </Card>
          );
        })}
        <Label>Valide une série d'un tap, corrige les reps si besoin.</Label>
        <Button label="Terminer la séance" onPress={finish} />
      </Screen>
      <RestTimer onReady={(h) => { timer.current = h; }} />
    </View>
  );
}
