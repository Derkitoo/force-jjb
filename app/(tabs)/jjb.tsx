import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Card, Chip, Label, Screen, Title } from '@/components/ui';
import type { BjjLog } from '@/domain/types';
import { useStore } from '@/lib/store';
import { flushQueue } from '@/lib/sync';
import { useColors } from '@/theme';

const INTENSITY = ['Technique', 'Tranquille', 'Normal', 'Dur', 'Guerre'];

export default function Jjb() {
  const c = useColors();
  const { bjj, logBjj } = useStore();
  const [duration, setDuration] = useState(90);
  const [intensity, setIntensity] = useState<BjjLog['intensity']>(3);
  const [rounds, setRounds] = useState(5);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const save = () => {
    logBjj({ date: new Date().toISOString(), durationMin: duration, intensity, sparringRounds: rounds, notes: notes || undefined });
    setSaved(true); setNotes('');
    flushQueue().catch(() => {});
  };

  const Stepper = ({ value, set, step, unit }: { value: number; set: (n: number) => void; step: number; unit: string }) => (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Chip label="−" onPress={() => set(Math.max(0, value - step))} />
      <Text style={{ color: c.ink, fontSize: 20, fontWeight: '700', minWidth: 80, textAlign: 'center', fontVariant: ['tabular-nums'] }}>{value} {unit}</Text>
      <Chip label="+" onPress={() => set(value + step)} />
    </View>
  );

  return (
    <Screen>
      <Title sub="Ce que tu notes ici ajuste ta prochaine séance de force.">Jiu-jitsu</Title>
      <Card accent={c.belt}>
        <Label>Durée</Label>
        <Stepper value={duration} set={setDuration} step={15} unit="min" />
        <Label>Intensité</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {INTENSITY.map((l, i) => <Chip key={l} label={l} active={intensity === i + 1} onPress={() => setIntensity((i + 1) as BjjLog['intensity'])} />)}
        </View>
        <Label>Rounds de sparring</Label>
        <Stepper value={rounds} set={setRounds} step={1} unit="rounds" />
        <Label>Techniques, sensations</Label>
        <TextInput value={notes} onChangeText={setNotes} multiline placeholder="Ex. passage de garde demi-garde, étranglement arm-in"
          placeholderTextColor={c.muted} accessibilityLabel="Notes"
          style={{ borderWidth: 1, borderColor: c.line, borderRadius: 8, padding: 10, color: c.ink, minHeight: 70 }} />
        <Button label="Enregistrer" onPress={save} />
        {saved ? <Text style={{ color: c.good, fontWeight: '600' }}>Enregistré. Ta prochaine séance en tient compte.</Text> : null}
      </Card>

      <Label>Derniers entraînements</Label>
      {bjj.length === 0 ? <Text style={{ color: c.muted }}>Aucun entraînement noté pour l'instant.</Text> : null}
      {bjj.slice(-10).reverse().map((b) => (
        <Card key={b.date}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: c.ink, fontWeight: '700' }}>{new Date(b.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</Text>
            <Text style={{ color: b.intensity >= 4 ? c.belt : c.muted, fontWeight: '600' }}>{INTENSITY[b.intensity - 1]}</Text>
          </View>
          <Text style={{ color: c.muted }}>{b.durationMin} min · {b.sparringRounds} rounds{b.notes ? ` · ${b.notes}` : ''}</Text>
        </Card>
      ))}
    </Screen>
  );
}
