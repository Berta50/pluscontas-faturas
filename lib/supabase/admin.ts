import { createClient } from "@supabase/supabase-js";

// Cliente Supabase com permissões de administrador (Service Role)
// AVISO DE SEGURANÇA: Este cliente NUNCA deve ser importado em código que corre no browser.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || serviceKey.startsWith("postgresql://")) {
    throw new Error(
      "A chave SUPABASE_SERVICE_ROLE_KEY não está configurada corretamente no .env.local. " +
        "Copie a chave secreta 'service_role' em Supabase Dashboard > Project Settings > API.",
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
