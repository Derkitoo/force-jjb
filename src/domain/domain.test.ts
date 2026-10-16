import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWeek, generateProgram } from './program';
import { adjustSession } from './adjust';
import { nextLoad } from './progression';
import type { OnboardingAnswers } from './types';

const kouider: OnboardingAnswers = {
  level: 'intermediaire', goal: 'hybride', equipment: 'salle',
  bjjDays: [0, 4], openMatDay: 6, strengthDaysPerWeek: 3, bodyweightKg: 80, competes: false,
};

test('planning : A mardi, B jeudi, C samedi autour du JJB lundi/vendredi', () => {
  const w = buildWeek(kouider).days;
  assert.deepEqual(w[0], { kind: 'jjb' });
  assert.deepEqual(w[4], { kind: 'jjb' });
  assert.deepEqual(w[6], { kind: 'openmat' });
  const muscu = w.map((d, i) => (d.kind === 'muscu' ? `${i}${d.session}` : null)).filter(Boolean);
  assert.equal(muscu.length, 3);
  // A ne tombe jamais la veille d'un JJB
  const aDay = w.findIndex((d) => d.kind === 'muscu' && d.session === 'A');
  assert.ok(![3, 6].includes(aDay), `A placé le jour ${aDay}`);
});

test('ajustement : JJB très dur hier → −10 %, une série de moins', () => {
  const p = generateProgram(kouider);
  const now = new Date('2026-10-20T18:00:00');
  const r = adjustSession(p.sessions.A, {
    now, weekInCycle: 2, cycleLength: 5, hoursToNextBjj: 48, openMatTomorrow: false,
    lastBjj: { date: '2026-10-19T20:00:00', durationMin: 90, intensity: 5, sparringRounds: 8 },
    loads: { squat: 120 },
  });
  const squat = r.exercises.find((e) => e.id === 'squat')!;
  assert.equal(squat.targetLoadKg, 107.5);
  assert.equal(squat.sets, 3);
  assert.ok(r.reasons.length >= 1);
});

test('ajustement : semaine allégée', () => {
  const p = generateProgram(kouider);
  const r = adjustSession(p.sessions.B, {
    now: new Date(), weekInCycle: 5, cycleLength: 5, hoursToNextBjj: 100, openMatTomorrow: false, loads: { bench: 100 },
  });
  assert.equal(r.deload, true);
  assert.equal(r.exercises.find((e) => e.id === 'bench')!.targetLoadKg, 85);
});

test('progression linéaire et reset après stagnation', () => {
  const sq = generateProgram(kouider).sessions.A.exercises[0];
  const ok = nextLoad(sq, 100, Array(4).fill({ loadKg: 100, reps: 5 }), 4, 0);
  assert.equal(ok.nextLoadKg, 105);
  const stuck = nextLoad(sq, 100, [{ loadKg: 100, reps: 5 }, { loadKg: 100, reps: 3 }], 4, 2);
  assert.equal(stuck.status, 'reset');
  assert.equal(stuck.nextLoadKg, 90);
});
