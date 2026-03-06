import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Cliente Supabase con service role (bypass RLS).
 * Solo usar en rutas protegidas (cron) que requieren acceso administrativo.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY es requerida para operaciones de cron (push notifications)."
    );
  }
  return createClient(env.supabaseUrl, key, {
    auth: { persistSession: false },
  });
}
