import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Card, Label, Screen, Title } from '@/components/ui';
import { e1rm } from '@/domain/progression';
import { useStore } from '@/lib/store';
import { useColors } from '@/theme';

const MAIN_LIFTS = [
  { id: 'squat', name: 'Squat' }, { id: 'bench', name: 'Développé couché' },
  { id: 'trapbar', name: 'Trap bar' }, { id: 'ohp', name: 'Militaire' },
];

/** mini graphique en barres sans dépendance */
function Bars({ values, color, track }: { values: number[]; color: string; track: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values) * 0.9;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 60 }}>
      {values.map((v, i) => (
        <View key={i} style={{ flex: 1, height: 60, justifyContent: 'flex-end', backgroundColor: track, borderRadius: 3 }}>
          <View style={{ height: `${Math.max(8, ((v - min) / (max - min || 1)) * 100)}%`, backgroundColor: color, borderRadius: 3, opacity: i === values.length - 1 ? 1 : 0.55 }} />
        </View>
      ))}
    </View>
  );
}

export default function Progres() {
  const c = useColors();
  const { workouts, bodyweight, logBodyweight, premium, cycleWeek, program, nextWeek, answers } = useStore();
  const [bw, setBw] = useState('');

  const series = (id: string) => workouts
    .map((w) => w.sets[id]).filter((s) => s && s.length)
    .map((s) => Math.round(Math.max(...s!.map((x) => e1rm(x.loadKg, x.reps)))));

  return (
    <Screen>
      <Title sub="1RM estimé sur tes meilleures séries.">Progrès</Title>

      {MAIN_LIFTS.map((l) => {
        const v = series(l.id);
        if (!v.length) return null;
        const shown = premium ? v.slice(-20) : v.slice(-4);
        return (
          <Card key={l.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: c.ink, fontWeight: '800', fontSize: 17 }}>{l.name}</Text>
              <Text style={{ color: c.accent, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{v[v.length - 1]} kg</Text>
            </View>
            {shown.length > 1 ? <Bars values={shown} color={c.accent} track={c.chip} /> : <Text style={{ color: c.muted }}>Encore une séance pour voir la courbe.</Text>}
            <Text style={{ color: c.muted, fontSize: 13 }}>Record : {Math.max(...v)} kg</Text>
          </Card>
        );
      })}
      {workouts.length === 0 ? <Text style={{ color: c.muted }}>Termine ta première séance pour voir tes courbes ici.</Text> : null}
      {!premium && workouts.length > 0 ? <Button kind="ghost" label="Historique complet avec Premium" onPress={() => router.push('/paywall')} /> : null}

      <Card>
        <Label>{answers?.competes ? 'Poids de corps · catégorie' : 'Poids de corps'}</Label>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput value={bw} onChangeText={setBw} keyboardType="decimal-pad" placeholder="kg" placeholderTextColor={c.muted} accessibilityLabel="Poids du jour"
            style={{ borderWidth: 1, borderColor: c.line, borderRadius: 8, padding: 10, color: c.ink, width: 100, fontSize: 17 }} />
          <View style={{ flex: 1 }}><Button label="Ajouter" onPress={() => { const k = parseFloat(bw.replace(',', '.')); if (k > 0) { logBodyweight(k); setBw(''); } }} /></View>
        </View>
        {bodyweight.length > 1 ? <Bars values={bodyweight.slice(-14).map((b) => b.kg)} color={c.belt} track={c.chip} /> : null}
        {bodyweight.length ? <Text style={{ color: c.muted }}>Dernier : {bodyweight[bodyweight.length - 1].kg} kg</Text> : null}
      </Card>

      <Card>
        <Label>Cycle</Label>
        <Text style={{ color: c.ink }}>Semaine {cycleWeek} sur {program?.cycleLength}. La dernière est allégée.</Text>
        <Button kind="ghost" label="Passer à la semaine suivante" onPress={nextWeek} />
      </Card>
    </Screen>
  );
}
