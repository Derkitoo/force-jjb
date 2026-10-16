import type {
  ExerciseTemplate, OnboardingAnswers, Program, SessionKey, SessionTemplate, Weekday, WeekPlan,
} from './types';

const gym = (a: OnboardingAnswers) => a.equipment === 'salle';

function sessionA(a: OnboardingAnswers): SessionTemplate {
  const adv = a.level !== 'debutant';
  const ex: ExerciseTemplate[] = [
    { id: 'squat', name: 'Squat', sets: adv ? 4 : 5, reps: 5, topSet: adv, increment: 5, restSec: 180, progression: 'lineaire', lowerHeavy: true, loaded: true },
    { id: 'rdl', name: 'Soulevé de terre roumain', sets: adv ? 4 : 3, reps: adv ? 6 : 8, increment: 5, restSec: 150, progression: 'lineaire', lowerHeavy: true, loaded: true },
    { id: 'pullup', name: adv ? 'Tractions lestées' : 'Tractions', sets: adv ? 5 : 4, reps: 5, increment: 2.5, restSec: 150, progression: 'lineaire', loaded: adv, note: 'Charge ajoutée au poids du corps.' },
    { id: 'row', name: 'Rowing barre', sets: adv ? 4 : 3, reps: [8, 10], increment: 2.5, restSec: 120, progression: 'double', loaded: true },
    { id: 'pallof', name: 'Pallof press', sets: 3, reps: 12, increment: 0, restSec: 60, progression: 'double', loaded: false },
  ];
  if (!gym(a)) {
    ex[0] = { ...ex[0], id: 'goblet', name: 'Goblet squat', reps: [8, 12], progression: 'double', increment: 2, topSet: false };
    ex[1] = { ...ex[1], id: 'sl-rdl', name: 'Soulevé roumain unilatéral haltère', reps: [8, 12], progression: 'double', increment: 2 };
    ex[3] = { ...ex[3], id: 'dbrow', name: 'Rowing haltère', increment: 2 };
  }
  return { key: 'A', name: 'Séance A', focus: 'Bas du corps lourd et dos', exercises: ex };
}

function sessionB(a: OnboardingAnswers): SessionTemplate {
  const adv = a.level !== 'debutant';
  const ex: ExerciseTemplate[] = [
    { id: 'bench', name: gym(a) ? 'Développé couché' : 'Développé couché haltères', sets: adv ? 4 : 5, reps: 5, topSet: adv && gym(a), increment: 2.5, restSec: 180, progression: 'lineaire', loaded: true },
    { id: 'ohp', name: 'Développé militaire', sets: adv ? 4 : 3, reps: 6, increment: 2.5, restSec: 150, progression: 'lineaire', loaded: true },
    { id: 'dips', name: adv ? 'Dips lestés' : 'Dips', sets: 3, reps: [6, 10], increment: 2.5, restSec: 120, progression: 'double', loaded: adv },
    { id: 'dbrow', name: 'Rowing haltère', sets: adv ? 4 : 3, reps: [8, 12], increment: 2, restSec: 90, progression: 'double', loaded: true, note: "Poids d'un haltère." },
    { id: 'bss', name: 'Fentes bulgares', sets: 3, reps: 8, increment: 2, restSec: 90, progression: 'double', lowerHeavy: true, loaded: true },
    { id: 'towel-hang', name: 'Suspension serviette', sets: 3, reps: 30, increment: 0, restSec: 90, progression: 'double', loaded: false, note: 'Secondes. Grip kimono.' },
  ];
  return { key: 'B', name: 'Séance B', focus: 'Haut du corps lourd', exercises: ex };
}

function sessionC(a: OnboardingAnswers): SessionTemplate {
  const ex: ExerciseTemplate[] = [
    { id: 'trapbar', name: gym(a) ? 'Trap bar deadlift' : 'Soulevé de terre haltères', sets: 4, reps: 5, increment: 5, restSec: 180, progression: 'lineaire', lowerHeavy: true, loaded: true },
    { id: 'incline', name: 'Développé incliné haltères', sets: 4, reps: [8, 12], increment: 2, restSec: 90, progression: 'double', loaded: true },
    { id: 'lat', name: gym(a) ? 'Tirage poitrine' : 'Tractions prise large', sets: 4, reps: [10, 12], increment: 2.5, restSec: 90, progression: 'double', loaded: gym(a) },
    { id: 'hipthrust', name: 'Hip thrust', sets: 4, reps: [8, 12], increment: 5, restSec: 90, progression: 'double', lowerHeavy: true, loaded: true, note: "Pour le pont et l'upa." },
    { id: 'farmer', name: "Farmer's walk", sets: 4, reps: 30, increment: 2, restSec: 90, progression: 'double', loaded: true, note: 'Mètres, poids par main.' },
    { id: 'neck', name: 'Nuque', sets: 3, reps: 15, increment: 0, restSec: 60, progression: 'double', loaded: false, note: 'Léger et contrôlé.' },
  ];
  if (a.goal !== 'force') {
    ex.push({ id: 'arms', name: 'Biceps + triceps (superset)', sets: 3, reps: [10, 15], increment: 1, restSec: 60, progression: 'double', loaded: false });
  }
  return { key: 'C', name: 'Séance C', focus: 'Volume et spécifique grappling', exercises: ex };
}

/** jours avant le prochain JJB (1 = JJB demain) */
function gapToNextBjj(day: Weekday, bjj: Set<number>): number {
  for (let i = 1; i <= 7; i++) if (bjj.has((day + i) % 7)) return i;
  return 7;
}

/**
 * Place les séances de force autour du JJB :
 * - jamais un jour de JJB ;
 * - A (bas du corps lourd) le jour le plus éloigné du prochain JJB ;
 * - évite deux séances de force consécutives quand c'est possible.
 */
export function buildWeek(a: OnboardingAnswers): WeekPlan {
  const bjj = new Set<number>(a.bjjDays);
  const days: WeekPlan['days'] = Array.from({ length: 7 }, (_, i) =>
    bjj.has(i) ? { kind: 'jjb' } : a.openMatDay === i ? { kind: 'openmat' } : { kind: 'repos' },
  );

  const free = ([0, 1, 2, 3, 4, 5, 6] as Weekday[]).filter((d) => !bjj.has(d) && d !== a.openMatDay);
  const wanted: SessionKey[] = a.strengthDaysPerWeek === 3 ? ['A', 'B', 'C'] : ['A', 'B'];

  const chosen: Weekday[] = [];
  const pick = (candidates: Weekday[], score: (d: Weekday) => number) => {
    const ok = candidates.filter((d) => !chosen.includes(d));
    const spaced = ok.filter((d) => !chosen.some((c) => Math.abs(c - d) === 1 || Math.abs(c - d) === 6));
    const pool = spaced.length ? spaced : ok;
    pool.sort((x, y) => score(y) - score(x) || x - y);
    return pool[0];
  };

  for (const key of wanted) {
    const d = key === 'A' ? pick(free, (x) => gapToNextBjj(x, bjj)) : pick(free, (x) => -Math.abs(x - 3));
    if (d === undefined) break;
    chosen.push(d);
    days[d] = { kind: 'muscu', session: key };
  }
  return { days };
}

export function generateProgram(a: OnboardingAnswers): Program {
  return {
    week: buildWeek(a),
    sessions: { A: sessionA(a), B: sessionB(a), C: sessionC(a) },
    cycleLength: a.level === 'debutant' ? 6 : 5,
  };
}
