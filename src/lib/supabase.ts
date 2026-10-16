import { createClient } from '@supabase/supabase-js';
import './kv'; // installe localStorage sur mobile (natif dans le navigateur)

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** null tant que les clés ne sont pas configurées : l'appli reste utilisable hors-ligne */
export const supabase = url && key
  ? createClient(url, key, {
    auth: {
      storage: localStorage, // persistant sur l'appareil
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
  : null;
