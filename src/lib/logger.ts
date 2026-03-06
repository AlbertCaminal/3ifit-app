/**
 * Logger centralizado para errores.
 * Sustituir console.error por logError para centralizar y facilitar integración con Sentry.
 */
export function logError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
) {
  console.error("[3iFit]", message, error ?? "", context ?? "");
}
