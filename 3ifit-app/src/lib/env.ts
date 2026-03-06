/**
 * Valida variables de entorno requeridas.
 * Usa referencias estáticas (process.env.X) para que Next.js las reemplace en el bundle.
 * Lanza un error claro si faltan, para evitar fallos silenciosos en runtime.
 */
function requireEnv(value: string | undefined, name: string): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Variable de entorno faltante: ${name}. Asegúrate de configurar .env.local con los valores de Supabase.`
    );
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return requireEnv(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL"
    );
  },
  get supabaseAnonKey() {
    return requireEnv(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  },
  /** URL base de la app en producción (opcional). Para Supabase Site URL, callbacks, etc. */
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
  },
};
