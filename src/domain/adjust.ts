import type { AdjustedSession, BjjLog, PlannedExercise, SessionTemplate } from './types';

export interface AdjustContext {
  now: Date;
  weekInCycle: number;
  cycleLength: number;
  /** dernier JJB enregistré */
  lastBjj?: BjjLog;
  /** heures avant le prochain JJB prévu (Infinity si aucun) */
  hoursToNextBjj: number;
  openMatTomorrow: boolean;
  /** charge de travail courante par exercice */
  loads: Record<string, number>;
}

const round = (kg: number, step = 2.5) => Math.round(kg / step) * step;

/**
 * Le cœur du produit : adapte la séance prévue à la fatigue du jiu-jitsu.
 * Chaque modification ajoute une raison lisible, affichée à l'utilisateur.
 */
export function adjustSession(t: SessionTemplate, ctx: AdjustContext): AdjustedSession {
  const reasons: string[] = [];
  const deload = ctx.weekInCycle >= ctx.cycleLength;

  let loadFactor = 1;
  let setDelta = 0;
  let minRir = 1;
  let lowerHeavyRir = 1;

  if (deload) {
    reasons.push('Semaine allégée : volume réduit de 40 % et charges à 85 %.');
  } else {
    const hoursSince = ctx.lastBjj
      ? (ctx.now.getTime() - new Date(ctx.lastBjj.date).getTime()) / 36e5
      : Infinity;

    if (ctx.lastBjj && hoursSince <= 30) {
      const { intensity, sparringRounds } = ctx.lastBjj;
      if (intensity >= 5 || (intensity >= 4 && sparringRounds >= 6)) {
        loadFactor = 0.9; setDelta -= 1; minRir = 2;
        reasons.push('JJB très intense hier : charges à −10 %, une série de moins, pas d’échec.');
      } else if (intensity >= 4) {
        setDelta -= 1; minRir = 2;
        reasons.push('JJB dur hier : une série de moins sur chaque exercice.');
      }
    }

    if (ctx.hoursToNextBjj <= 24) {
      lowerHeavyRir = 3;
      reasons.push('JJB demain : marge de 3 répétitions sur les exercices de jambes.');
    }

    if (ctx.openMatTomorrow) {
      setDelta = Math.min(setDelta, -1);
      minRir = Math.max(minRir, 2);
      reasons.push('Open mat demain : une série de moins, pas d’échec.');
    }
  }

  const exercises: PlannedExercise[] = t.exercises.map((e) => {
    let sets = deload ? Math.max(2, Math.ceil(e.sets * 0.6)) : Math.max(2, e.sets + setDelta);
    const base = ctx.loads[e.id] ?? 0;
    const factor = deload ? 0.85 : loadFactor;
    const targetLoadKg = e.loaded ? round(base * factor, e.increment >= 2.5 ? 2.5 : 1) : 0;
    let rir = deload ? 3 : Math.max(minRir, e.lowerHeavy ? lowerHeavyRir : 1);
    return { ...e, sets, targetLoadKg, rir };
  });

  return { template: t, exercises, reasons, deload };
}
