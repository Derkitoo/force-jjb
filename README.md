# Force JJB

App mobile (iOS / Android) : programme de force et de masse qui s'adapte aux entraînements de jiu-jitsu brésilien.
Nom de travail : à remplacer avant la publication (vérifier stores, domaine, INPI).

## Stack

- Expo + Expo Router, TypeScript
- Hors-ligne d'abord : état local persisté (zustand + `expo-sqlite/kv-store`), file de synchro vers Supabase
- Supabase : auth, données, RLS, Edge Function pour le webhook RevenueCat
- RevenueCat : abonnements in-app Apple / Google (Stripe réservé à une future offre club vendue sur le web)

## Démarrer

```bash
npm install
npx expo install --fix        # aligne les versions sur ton SDK Expo
cp .env.example .env          # clés Supabase + RevenueCat
npm test                      # tests de la logique métier
npx expo prebuild && npm run ios   # build de dev (RevenueCat ne marche pas dans Expo Go)
```

Supabase :

```bash
supabase link --project-ref <ref>
supabase db push
supabase secrets set REVENUECAT_WEBHOOK_SECRET=<secret>
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

## Structure

```
app/
  _layout.tsx            init notifications, achats, synchro
  onboarding.tsx         niveau, objectif, jours de JJB, open mat, poids → programme
  (tabs)/index.tsx       séance du jour + ajustements expliqués
  (tabs)/jjb.tsx         journal de jiu-jitsu (durée, intensité, rounds, notes)
  (tabs)/progres.tsx     1RM estimé, records, poids de corps, cycle
  session/[key].tsx      séance guidée : séries, charges, minuteur, fin de séance
  paywall.tsx            offre Premium RevenueCat
src/domain/              logique pure, testée (aucune dépendance React)
  program.ts             génération des séances A/B/C et placement dans la semaine
  adjust.ts              ajustement selon fatigue JJB, veille de JJB, open mat, semaine allégée
  progression.ts         linéaire / double progression, reset après 3 stagnations, 1RM
src/lib/                 store local, synchro Supabase, achats, notifications
supabase/                migration SQL + Edge Function webhook
```

## Règles d'ajustement (le cœur du produit)

| Situation | Effet |
|---|---|
| JJB intensité 5, ou 4 avec ≥ 6 rounds, dans les 30 h | charges −10 %, une série de moins, 2 reps en réserve |
| JJB intensité 4 dans les 30 h | une série de moins, 2 reps en réserve |
| JJB dans les 24 h | 3 reps en réserve sur les exercices de jambes |
| Open mat le lendemain | une série de moins, pas d'échec |
| Dernière semaine du cycle | volume −40 %, charges à 85 %, pas de progression |

Chaque ajustement renvoie une phrase affichée à l'utilisateur : c'est ce qui rend l'appli crédible.

## Gratuit / Premium

- Gratuit : programme complet, journal JJB, 1 ajustement affiché, 4 dernières séances en courbe
- Premium : tous les ajustements, historique complet, futurs programmes (prépa compétition, reprise)

## Prochaines étapes

1. Écran de connexion Supabase (e-mail magique + Apple / Google)
2. Remplacer les icônes d'onglets par un jeu d'icônes, polices de marque
3. Configurer produits et offering `default` dans RevenueCat, entitlement `premium`
4. Politique de confidentialité RGPD et suppression de compte dans l'appli (exigée par Apple)
5. TestFlight avec 10 pratiquants du club, puis itération
