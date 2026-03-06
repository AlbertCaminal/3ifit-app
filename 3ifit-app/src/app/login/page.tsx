"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/app";
  const authError = searchParams.get("error") === "auth";

  const [loginError, setLoginError] = useState<string | null>(null);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoginError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
        queryParams: {
          prompt: "select_account",
          access_type: "offline",
        },
      },
    });
    if (error) {
      setLoginError(error.message);
    }
  };

  const errorMessage = authError
    ? "No se pudo iniciar sesión. Por favor, inténtalo de nuevo."
    : loginError;

  return (
    <div id="main-content" tabIndex={-1} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[var(--color-primary-light)] via-white to-[var(--background)] px-6">
      {/* Formas decorativas de fondo */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-primary)]/5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-[var(--color-primary)]/5"
        aria-hidden
      />

      <div className="relative flex w-full max-w-sm flex-col items-center">
        {/* Card contenedor */}
        <div className="flex w-full flex-col items-center gap-8 rounded-3xl bg-[var(--color-bg-card)] p-8 shadow-[var(--shadow-card)]">
          {/* Logo y branding */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-[var(--color-primary-light)]">
              <Image
                src="/icons/tresipunt_logo.jfif"
                alt="3iFit"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                3iFit
              </h1>
            </div>
          </div>

          <p className="text-center text-sm text-[var(--color-text-muted)]">
            Inicia sesión con tu cuenta de empresa para acceder a la app.
          </p>

          {errorMessage && (
            <div
              role="alert"
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="btn-primary flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--color-primary)] px-6 py-4 text-base font-semibold text-white shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Iniciar sesión con Google
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          Seguro y privado · Solo para empleados
        </p>
      </div>
    </div>
  );
}
