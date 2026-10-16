// Stockage clé-valeur persistant : SQLite sur iOS / Android (kv.web.ts pour le navigateur)
import 'expo-sqlite/localStorage/install'; // localStorage pour la session Supabase
export { default as kv } from 'expo-sqlite/kv-store';
