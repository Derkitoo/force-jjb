/** JS getDay() (0 = dimanche) → 0 = lundi */
export const todayIndex = (d = new Date()) => (d.getDay() + 6) % 7;

/** heures jusqu'au prochain jour de JJB (entraînement supposé à 18 h) */
export function hoursToNextBjj(bjjDays: number[], now = new Date()): number {
  const t = todayIndex(now);
  for (let i = 1; i <= 7; i++) {
    if (bjjDays.includes((t + i) % 7)) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      d.setHours(18, 0, 0, 0);
      return (d.getTime() - now.getTime()) / 36e5;
    }
  }
  return Infinity;
}
