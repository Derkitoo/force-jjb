// Edge Function : reçoit les événements RevenueCat et met à jour public.entitlements.
// Déploiement : supabase functions deploy revenuecat-webhook --no-verify-jwt
// Dans RevenueCat > Integrations > Webhooks : URL de la fonction + header Authorization = REVENUECAT_WEBHOOK_SECRET
import { createClient } from 'npm:@supabase/supabase-js@2';

const ACTIVE = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE']);
const INACTIVE = new Set(['EXPIRATION', 'BILLING_ISSUE']);

Deno.serve(async (req) => {
  if (req.headers.get('Authorization') !== Deno.env.get('REVENUECAT_WEBHOOK_SECRET')) {
    return new Response('unauthorized', { status: 401 });
  }
  const { event } = await req.json();
  const userId: string | undefined = event?.app_user_id; // = auth.users.id (Purchases.logIn)
  if (!userId || (!ACTIVE.has(event.type) && !INACTIVE.has(event.type))) {
    return new Response('ignored');
  }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error } = await db.from('entitlements').upsert({
    user_id: userId,
    premium: ACTIVE.has(event.type),
    product_id: event.product_id ?? null,
    expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
    updated_at: new Date().toISOString(),
  });
  return error ? new Response(error.message, { status: 500 }) : new Response('ok');
});
