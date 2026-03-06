"use client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function hasEnv(): boolean {
  return (
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL.trim().length > 0 &&
    typeof SUPABASE_ANON_KEY === "string" &&
    SUPABASE_ANON_KEY.trim().length > 0
  );
}

export function EnvGuard({ children }: { children: React.ReactNode }) {
  if (!hasEnv()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-6">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-xl font-bold text-amber-900">
            Configuración requerida
          </h1>
          <p className="mt-3 text-sm text-amber-800">
            Faltan las variables de entorno de Supabase. Crea el archivo{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
              .env.local
            </code>{" "}
            en la raíz del proyecto con:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-[var(--color-bg-muted)] p-4 text-left text-xs text-[var(--color-text-primary)]">
            {`NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key`}
          </pre>
          <p className="mt-4 text-sm text-amber-800">
            Asegúrate de ejecutar desde la carpeta del proyecto (
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">3ifit-app</code>
            ). Copia los valores desde tu proyecto en{" "}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
            >
              supabase.com
            </a>
            , luego reinicia el servidor (<code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">npm run dev</code>).
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
