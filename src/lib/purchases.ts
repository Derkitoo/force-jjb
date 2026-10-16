import { Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { useStore } from './store';

export const ENTITLEMENT = 'premium';

export async function initPurchases(userId?: string) {
  const apiKey = Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  if (!apiKey) return;
  Purchases.configure({ apiKey, appUserID: userId }); // appUserID = id Supabase → webhook
  const info = await Purchases.getCustomerInfo();
  useStore.getState().setPremium(!!info.entitlements.active[ENTITLEMENT]);
}

export async function getOffer(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function buy(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const ok = !!customerInfo.entitlements.active[ENTITLEMENT];
  useStore.getState().setPremium(ok);
  return ok;
}

export async function restore(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  const ok = !!info.entitlements.active[ENTITLEMENT];
  useStore.getState().setPremium(ok);
  return ok;
}
