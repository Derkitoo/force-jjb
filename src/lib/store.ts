import { kv } from './kv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { generateProgram } from '@/domain/program';
import { nextLoad } from '@/domain/progression';
import type { BjjLog, OnboardingAnswers, Program, SessionKey, SetResult } from '@/domain/types';

export interface WorkoutRecord {
  id: string;
  session: SessionKey;
  date: string;
  deload: boolean;
  reasons: string[];
  sets: Record<string, SetResult[]>;
}

export interface PendingSync { table: string; row: Record<string, unknown> }

interface State {
  answers?: OnboardingAnswers;
  program?: Program;
  cycleWeek: number;
  loads: Record<string, number>;
  stalled: Record<string, number>;
  workouts: WorkoutRecord[];
  bjj: BjjLog[];
  bodyweight: { date: string; kg: number }[];
  premium: boolean;
  queue: PendingSync[];

  completeOnboarding: (a: OnboardingAnswers, startLoads: Record<string, number>) => void;
  setLoad: (id: string, kg: number) => void;
  finishWorkout: (w: WorkoutRecord, planned: Record<string, number>) => Record<string, string>;
  logBjj: (b: BjjLog) => void;
  logBodyweight: (kg: number) => void;
  nextWeek: () => void;
  setPremium: (v: boolean) => void;
  dequeue: (n: number) => void;
}

/** UUID v4 : workouts.id est de type uuid côté Supabase, sinon l'upsert échoue et bloque la file */
const uid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
  const r = (Math.random() * 16) | 0;
  return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
});

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      cycleWeek: 1,
      loads: {},
      stalled: {},
      workouts: [],
      bjj: [],
      bodyweight: [],
      premium: false,
      queue: [],

      completeOnboarding: (answers, startLoads) =>
        set({ answers, program: generateProgram(answers), loads: startLoads, cycleWeek: 1 }),

      setLoad: (id, kg) => set((s) => ({ loads: { ...s.loads, [id]: Math.max(0, kg) } })),

      /** enregistre la séance, applique la progression, renvoie un message par exercice */
      finishWorkout: (w, planned) => {
        const s = get();
        const tpl = s.program!.sessions[w.session];
        const loads = { ...s.loads };
        const stalled = { ...s.stalled };
        const messages: Record<string, string> = {};
        if (!w.deload) {
          for (const e of tpl.exercises) {
            const res = w.sets[e.id] ?? [];
            if (!res.length) continue;
            const r = nextLoad(e, loads[e.id] ?? 0, res, planned[e.id] ?? e.sets, stalled[e.id] ?? 0);
            loads[e.id] = r.nextLoadKg;
            stalled[e.id] = r.status === 'monte' || r.status === 'reset' ? 0 : (stalled[e.id] ?? 0) + 1;
            messages[e.id] = r.message;
          }
        }
        const id = w.id || uid();
        set({
          workouts: [...s.workouts, { ...w, id }].slice(-500),
          loads, stalled,
          queue: [...s.queue, { table: 'workouts', row: { id, session_key: w.session, started_at: w.date, finished_at: new Date().toISOString(), deload: w.deload, adjustments: w.reasons } },
            ...Object.entries(w.sets).flatMap(([exercise_id, arr]) =>
              arr.map((x, i) => ({ table: 'workout_sets', row: { workout_id: id, exercise_id, set_index: i, load_kg: x.loadKg, reps: x.reps, rpe: x.rpe ?? null } }))),
            ...Object.entries(loads).map(([exercise_id, load_kg]) => ({ table: 'exercise_loads', row: { exercise_id, load_kg, stalled_sessions: stalled[exercise_id] ?? 0 } }))],
        });
        return messages;
      },

      logBjj: (b) => set((s) => ({
        bjj: [...s.bjj, b].slice(-500),
        queue: [...s.queue, { table: 'bjj_sessions', row: { date: b.date, duration_min: b.durationMin, intensity: b.intensity, sparring_rounds: b.sparringRounds, notes: b.notes ?? null } }],
      })),

      logBodyweight: (kg) => set((s) => {
        const date = new Date().toISOString().slice(0, 10);
        return {
          bodyweight: [...s.bodyweight.filter((x) => x.date !== date), { date, kg }],
          queue: [...s.queue, { table: 'body_metrics', row: { date, bodyweight_kg: kg } }],
        };
      }),

      nextWeek: () => set((s) => ({ cycleWeek: s.cycleWeek >= (s.program?.cycleLength ?? 5) ? 1 : s.cycleWeek + 1 })),
      setPremium: (premium) => set({ premium }),
      dequeue: (n) => set((s) => ({ queue: s.queue.slice(n) })),
    }),
    { name: 'force-jjb', storage: createJSONStorage(() => kv) },
  ),
);
