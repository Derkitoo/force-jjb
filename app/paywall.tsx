import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Button, Card, Label, Screen, Title } from '@/components/ui';
import { buy, getOffer, restore } from '@/lib/purchases';
import { useColors } from '@/theme';

const PERKS = [
  'Tous les ajustements automatiques selon ton JJB',
  'Historique et courbes de progression complets',
  'Suivi du poids pour ta catégorie',
  'Nouveaux programmes : prépa compétition, reprise après blessure',
];

export default function Paywall() {
  const c = useColors();
  const [pkgs, setPkgs] = useState<PurchasesPackage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getOffer().then(setPkgs).catch(() => setError("Impossible de charger les offres. Vérifie ta connexion et réessaie."));
  }, []);

  const run = async (fn: () => Promise<boolean>) => {
    setBusy(true); setError(null);
    try { if (await fn()) router.back(); else setError('Aucun abonnement actif trouvé sur ce compte.'); }
    catch (e: any) { if (!e?.userCancelled) setError("L'achat n'a pas abouti. Aucun montant n'a été débité."); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <Title sub="La muscu qui s'adapte à ton jiu-jitsu.">Premium</Title>
      <Card>
        {PERKS.map((p) => <Text key={p} style={{ color: c.ink, fontSize: 15 }}>✓  {p}</Text>)}
      </Card>
      {pkgs.map((p) => (
        <View key={p.identifier} style={{ gap: 4 }}>
          <Label>{p.packageType === 'ANNUAL' ? 'Annuel' : p.packageType === 'MONTHLY' ? 'Mensuel' : p.product.title}</Label>
          <Button disabled={busy} label={`${p.product.priceString}${p.packageType === 'ANNUAL' ? ' / an' : p.packageType === 'MONTHLY' ? ' / mois' : ''}`} onPress={() => run(() => buy(p))} />
        </View>
      ))}
      {error ? <Text style={{ color: c.belt }}>{error}</Text> : null}
      <Button kind="ghost" disabled={busy} label="Restaurer mes achats" onPress={() => run(restore)} />
      <Text style={{ color: c.muted, fontSize: 12 }}>Abonnement renouvelé automatiquement, résiliable à tout moment dans les réglages de ton compte Apple ou Google.</Text>
    </Screen>
  );
}
