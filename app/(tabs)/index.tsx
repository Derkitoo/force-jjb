import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Label, Screen, Title } from '@/components/ui';
import { adjustSession } from '@/domain/adjust';
import { useStore } from '@/lib/store';
import { hoursToNextBjj } from '@/domain/schedule';
import { DAY_LABELS, todayIndex, useColors } from '@/theme';

export default function Today() {
  const c = useColors();
  const { program, answers, cycleWeek, loads, bjj, premium } = useStore();
  if (!program || !answers) return null;

  const t = todayIndex();
  const day = program.week.days[t];
  const tomorrow = program.week.days[(t + 1) % 7];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Title>Aujourd'hui</Title>
        <Text style={{ color: c.muted, fontVariant: ['tabular-nums'] }}>Semaine {cycleWeek}/{program.cycleLength}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {program.week.days.map((d, i) => {
          const txt = d.kind === 'muscu' ? d.session : d.kind === 'jjb' ? 'JJB' : d.kind === 'openmat' ? 'Open' : '–';
          const isBjj = d.kind === 'jjb' || d.kind === 'openmat';
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: i === t ? c.ink : c.chip }}>
              <Text style={{ fontSize: 11, color: i === t ? c.bg : c.muted }}>{DAY_LABELS[i]}</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: i === t ? c.bg : isBjj ? c.belt : c.ink }}>{txt}</Text>
            </View>
          );
        })}
      </View>

      {day.kind === 'muscu' ? (() => {
        const adj = adjustSession(program.sessions[day.session], {
          now: new Date(), weekInCycle: cycleWeek, cycleLength: program.cycleLength,
          lastBjj: bjj[bjj.length - 1], hoursToNextBjj: hoursToNextBjj(answers.bjjDays),
          openMatTomorrow: tomorrow.kind === 'openmat', loads,
        });
        const shownReasons = premium ? adj.reasons : adj.reasons.slice(0, 1);
        return (
          <Card>
            <Text style={{ color: c.ink, fontSize: 24, fontWeight: '800' }}>{adj.template.name}</Text>
            <Text style={{ color: c.muted }}>{adj.template.focus} · {adj.exercises.length} exercices</Text>
            {shownReasons.length ? (
              <View style={{ gap: 4, backgroundColor: c.chip, borderRadius: 8, padding: 10 }}>
                <Label>Ajusté pour ton JJB</Label>
                {shownReasons.map((r) => <Text key={r} style={{ color: c.ink }}>{r}</Text>)}
                {!premium && adj.reasons.length > 1 ? (
                  <Pressable onPress={() => router.push('/paywall')}><Text style={{ color: c.accent, fontWeight: '700' }}>Voir tous les ajustements avec Premium</Text></Pressable>
                ) : null}
              </View>
            ) : null}
            <Button label="Commencer la séance" onPress={() => router.push({ pathname: '/session/[key]', params: { key: day.session } })} />
          </Card>
        );
      })() : (
        <Card accent={c.belt}>
          <Text style={{ color: c.ink, fontSize: 24, fontWeight: '800' }}>
            {day.kind === 'jjb' ? 'Jiu-jitsu' : day.kind === 'openmat' ? 'Open mat' : 'Repos'}
          </Text>
          <Text style={{ color: c.muted }}>
            {day.kind === 'jjb' ? 'Pas de muscu lourde. Note ton entraînement après : il ajuste ta prochaine séance.'
              : day.kind === 'openmat' ? "Si tu n'y vas pas : 15 à 20 min de drills (shrimps, ponts, sorties de hanche)."
              : 'Repos ou cardio léger 30 min, mobilité hanches et épaules.'}
          </Text>
          {day.kind !== 'repos' ? <Button label="Noter mon entraînement" onPress={() => router.push('/jjb')} /> : null}
        </Card>
      )}
    </Screen>
  );
}
