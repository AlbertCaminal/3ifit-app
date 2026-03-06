"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("Global error", error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backgroundColor: "#f9fafb",
            color: "#1f2937",
          }}
        >
          <div
            style={{
              maxWidth: "24rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
              Error crítico
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#57534e", margin: 0 }}>
              Ha ocurrido un error grave. Por favor, recarga la página.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                backgroundColor: "#f84015",
                color: "white",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
