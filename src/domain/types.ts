// 0 = lundi … 6 = dimanche
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Level = 'debutant' | 'intermediaire' | 'avance';
export type Goal = 'force' | 'masse' | 'hybride';
export type Equipment = 'salle' | 'maison';

export interface OnboardingAnswers {
  level: Level;
  goal: Goal;
  equipment: Equipment;
  bjjDays: Weekday[];
  openMatDay?: Weekday;
  strengthDaysPerWeek: 2 | 3;
  bodyweightKg: number;
  competes: boolean;
}

export type SessionKey = 'A' | 'B' | 'C';

export type Progression = 'lineaire' | 'double';

export interface ExerciseTemplate {
  id: string;
  name: string;
  sets: number;
  /** reps cibles ; pour la double progression : [min, max] */
  reps: number | [number, number];
  /** série lourde en tête (top set) puis back-off à −10 % */
  topSet?: boolean;
  increment: number; // kg
  restSec: number;
  progression: Progression;
  /** sollicite fortement les jambes / la chaîne postérieure */
  lowerHeavy?: boolean;
  /** charge suivie (false = poids du corps, gainage…) */
  loaded: boolean;
  note?: string;
}

export interface SessionTemplate {
  key: SessionKey;
  name: string;
  focus: string;
  exercises: ExerciseTemplate[];
}

export interface WeekPlan {
  /** index = Weekday */
  days: Array<{ kind: 'muscu'; session: SessionKey } | { kind: 'jjb' } | { kind: 'openmat' } | { kind: 'repos' }>;
}

export interface Program {
  week: WeekPlan;
  sessions: Record<SessionKey, SessionTemplate>;
  cycleLength: number; // semaines, dernière = allégée
}

export interface BjjLog {
  date: string; // ISO
  durationMin: number;
  /** 1 = technique tranquille … 5 = guerre */
  intensity: 1 | 2 | 3 | 4 | 5;
  sparringRounds: number;
  notes?: string;
}

export interface PlannedExercise extends ExerciseTemplate {
  targetLoadKg: number;
  /** répétitions en réserve visées (0 = échec) */
  rir: number;
}

export interface AdjustedSession {
  template: SessionTemplate;
  exercises: PlannedExercise[];
  reasons: string[];
  deload: boolean;
}

export interface SetResult {
  loadKg: number;
  reps: number;
  rpe?: number;
}
