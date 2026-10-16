import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Card, Chip, Label, Screen, Title } from '@/components/ui';
import { generateProgram } from '@/domain/program';
import type { Equipment, Goal, Level, OnboardingAnswers, Weekday } from '@/domain/types';
import { useStore } from '@/lib/store';
import { DAY_LABELS, useColors } from '@/theme';

/** charges de départ prudentes, en fraction du poids de corps */
const START_RATIO: Record<string, [number, number, number]> = {
  //            débutant, intermédiaire, avancé
  squat: [0.6, 1.1, 1.5], rdl: [0.5, 0.9, 1.2], row: [0.4, 0.7, 0.9], bench: [0.5, 0.85, 1.15],
  ohp: [0.3, 0.5, 0.65], trapbar: [0.7, 1.3, 1.7], hipthrust: [0.6, 1.1, 1.5], lat: [0.4, 0.65, 0.85],
  dbrow: [0.15, 0.3, 0.4], incline: [0.12, 0.3, 0.38], bss: [0.08, 0.2, 0.3], farmer: [0.25, 0.4, 0.5],
};

export default function Onboarding() {
  const c = useColors();
  const done = useStore((s) => s.completeOnboarding);
  const [level, setLevel] = useState<Level>('intermediaire');
  const [goal, setGoal] = useState<Goal>('hybride');
  const [equipment, setEquipment] = useState<Equipment>('salle');
  const [bjjDays, setBjjDays] = useState<Weekday[]>([0, 4]);
  const [openMat, setOpenMat] = useState<Weekday | undefined>(6);
  const [strength, setStrength] = useState<2 | 3>(3);
  const [bw, setBw] = useState('80');
  const [competes, setCompetes] = useState(false);

  const toggleDay = (d: Weekday) =>
    setBjjDays((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d].sort() as Weekday[]));

  const submit = () => {
    const kg = parseFloat(bw.replace(',', '.')) || 80;
    const answers: OnboardingAnswers = { level, goal, equipment, bjjDays, openMatDay: openMat, strengthDaysPerWeek: strength, bodyweightKg: kg, competes };
    const lvl = level === 'debutant' ? 0 : level === 'intermediaire' ? 1 : 2;
    const loads: Record<string, number> = {};
    const p = generateProgram(answers);
    for (const s of Object.values(p.sessions)) for (const e of s.exercises) {
      const r = START_RATIO[e.id];
      loads[e.id] = r ? Math.round((kg * r[lvl]) / 2.5) * 2.5 : 0;
    }
    done(answers, loads);
    router.replace('/');
  };

  const Row = ({ children }: { children: React.ReactNode }) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;

  return (
    <Screen>
      <Title sub="Ton programme de force se cale sur ton jiu-jitsu. 1 minute.">Bienvenue</Title>
      <Card>
        <Label>Niveau en musculation</Label>
        <Row>{(['debutant', 'intermediaire', 'avance'] as Level[]).map((l) =>
          <Chip key={l} label={{ debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }[l]} active={level === l} onPress={() => setLevel(l)} />)}</Row>
        <Label>Objectif</Label>
        <Row>{(['force', 'masse', 'hybride'] as Goal[]).map((g) =>
          <Chip key={g} label={{ force: 'Force', masse: 'Masse', hybride: 'Force + masse' }[g]} active={goal === g} onPress={() => setGoal(g)} />)}</Row>
        <Label>Matériel</Label>
        <Row>
          <Chip label="Salle complète" active={equipment === 'salle'} onPress={() => setEquipment('salle')} />
          <Chip label="Haltères à la maison" active={equipment === 'maison'} onPress={() => setEquipment('maison')} />
        </Row>
      </Card>

      <Card>
        <Label>Jours de jiu-jitsu</Label>
        <Row>{DAY_LABELS.map((d, i) => <Chip key={d} label={d} active={bjjDays.includes(i as Weekday)} onPress={() => toggleDay(i as Weekday)} />)}</Row>
        <Label>Open mat (facultatif)</Label>
        <Row>
          <Chip label="Aucun" active={openMat === undefined} onPress={() => setOpenMat(undefined)} />
          {DAY_LABELS.map((d, i) => bjjDays.includes(i as Weekday) ? null :
            <Chip key={d} label={d} active={openMat === i} onPress={() => setOpenMat(i as Weekday)} />)}
        </Row>
        <Label>Séances de muscu par semaine</Label>
        <Row>
          <Chip label="2" active={strength === 2} onPress={() => setStrength(2)} />
          <Chip label="3" active={strength === 3} onPress={() => setStrength(3)} />
        </Row>
      </Card>

      <Card>
        <Label>Poids de corps (kg)</Label>
        <TextInput value={bw} onChangeText={setBw} keyboardType="decimal-pad" accessibilityLabel="Poids de corps en kilos"
          style={{ borderWidth: 1, borderColor: c.line, borderRadius: 8, padding: 10, color: c.ink, fontSize: 18, width: 110 }} />
        <Label>Tu fais des compétitions ?</Label>
        <Row>
          <Chip label="Non" active={!competes} onPress={() => setCompetes(false)} />
          <Chip label="Oui, je surveille ma catégorie" active={competes} onPress={() => setCompetes(true)} />
        </Row>
        <Text style={{ color: c.muted, fontSize: 13 }}>Les charges de départ sont estimées depuis ton poids. Tu les ajustes à la première séance.</Text>
      </Card>

      <Button label="Créer mon programme" onPress={submit} disabled={bjjDays.length === 0} />
    </Screen>
  );
}
