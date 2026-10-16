import type { ExerciseTemplate, SetResult } from './types';

/** 1RM estimé (Epley) */
export const e1rm = (kg: number, reps: number) => (reps <= 1 ? kg : kg * (1 + reps / 30));

const target = (r: ExerciseTemplate['reps']) => (Array.isArray(r) ? r : [r, r]);

export interface ProgressionResult {
  nextLoadKg: number;
  status: 'monte' | 'tient' | 'stagne' | 'reset';
  message: string;
}

/**
 * - Linéaire : toutes les séries réussies → +incrément.
 * - Double : toutes les séries au haut de la fourchette → +incrément, sinon on ajoute des reps.
 * - 3 séances sans progression → reset à −10 %.
 */
export function nextLoad(
  e: ExerciseTemplate,
  current: number,
  results: SetResult[],
  plannedSets: number,
  stalledSessions: number,
): ProgressionResult {
  const [min, max] = target(e.reps);
  const done = results.length >= plannedSets;
  const goal = e.progression === 'lineaire' ? min : max;
  const success = done && results.every((s) => s.reps >= goal);

  if (!e.loaded || e.increment === 0) {
    return { nextLoadKg: current, status: success ? 'monte' : 'tient', message: success ? 'Objectif atteint, ajoute des reps ou du lest.' : 'Garde le même objectif.' };
  }
  if (success) {
    return { nextLoadKg: current + e.increment, status: 'monte', message: `+${e.increment} kg à la prochaine séance.` };
  }
  if (stalledSessions + 1 >= 3) {
    const reset = Math.round((current * 0.9) / 2.5) * 2.5;
    return { nextLoadKg: reset, status: 'reset', message: `3 séances sans progresser : on repart de ${reset} kg pour relancer.` };
  }
  const minHit = results.every((s) => s.reps >= min);
  return minHit
    ? { nextLoadKg: current, status: 'tient', message: 'Même charge, vise une rep de plus.' }
    : { nextLoadKg: current, status: 'stagne', message: 'Séance difficile : même charge la prochaine fois.' };
}
