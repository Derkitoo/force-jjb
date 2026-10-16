import { supabase } from './supabase';
import { useStore } from './store';

const UPSERT_KEYS: Record<string, string> = {
  exercise_loads: 'user_id,exercise_id',
  body_metrics: 'user_id,date',
};

/**
 * Hors-ligne d'abord : tout est écrit en local, puis la file est vidée vers Supabase
 * quand l'utilisateur est connecté et qu'il y a du réseau. Appelé au lancement et en fin de séance.
 */
export async function flushQueue(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;

  const { queue, dequeue } = useStore.getState();
  let sent = 0;
  for (const item of queue) {
    const row = { ...item.row, user_id: userId };
    const onConflict = UPSERT_KEYS[item.table];
    const { error } = onConflict
      ? await supabase.from(item.table).upsert(row, { onConflict })
      : await supabase.from(item.table).upsert(row);
    if (error) break; // on réessaiera plus tard, dans l'ordre
    sent++;
  }
  if (sent) dequeue(sent);
}

export async function refreshPremium(): Promise<void> {
  const { data } = await supabase.from('entitlements').select('premium, expires_at').maybeSingle();
  if (!data) return;
  const active = data.premium && (!data.expires_at || new Date(data.expires_at) > new Date());
  useStore.getState().setPremium(active);
}
