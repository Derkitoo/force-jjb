# Handover — Force JJB

Dernière mise à jour : 2026-10-16

## État

- Dépôt : https://github.com/Derkitoo/force-jjb (branche `main`)
- App Expo (SDK 54, Expo Router) : onboarding, séance du jour ajustée au JJB, séance guidée avec minuteur, journal JJB, progrès, paywall RevenueCat.
- Supabase : migration `0001_init.sql` (tables + RLS) et Edge Function `revenuecat-webhook`. Pas encore déployé.
- `npm test` (4 tests de la logique métier) et `npm run typecheck` passent.
- Jamais lancé sur un appareil.

## Livré

- 2026-10-16 — Premier commit. Correctifs :
  - ids de séance en UUID v4 (avant : chaîne aléatoire refusée par `workouts.id uuid`, ce qui bloquait toute la file de synchro) — `src/lib/store.ts`
  - boutons +/− de charge en séance : la charge affichée et celle des séries cochées suivent maintenant la correction — `app/session/[key].tsx`

## Problèmes connus

- Pas d'écran de connexion : sans session Supabase, la file de synchro ne part jamais.
- RevenueCat : l'id Supabase n'est passé qu'au `configure` du lancement ; il faudra `Purchases.logIn(userId)` après connexion, sinon le webhook ne relie pas l'achat au compte.
- L'écran de séance affiche tous les ajustements, même en gratuit (l'accueil n'en montre qu'un).
- `bjj_sessions` est envoyé sans id : un renvoi partiel peut créer des doublons.

## Prochaines étapes

1. Écran de connexion Supabase (lien magique + Apple / Google) et `Purchases.logIn`
2. Icônes d'onglets et polices de marque
3. Produits et offering `default` dans RevenueCat, entitlement `premium`
4. Politique de confidentialité RGPD + suppression de compte dans l'appli
5. TestFlight avec 10 pratiquants du club
