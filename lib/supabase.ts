import { createClient } from "@supabase/supabase-js";

// Cliente só de servidor: usa a service role key. Nunca importe este arquivo em código do navegador.
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const STATE_ID = "tiago";
