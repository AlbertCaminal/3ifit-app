"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { getDarkModeUnlocked } from "@/app/(app)/app/configuracion/actions";

/**
 * Sincroniza el estado de desbloqueo del modo oscuro con el perfil del usuario.
 * En /app: consulta dark_mode_unlocked. Fuera de /app: permite modo oscuro.
 */
export function ThemeUnlockSync() {
  const pathname = usePathname();
  const { setDarkModeUnlocked } = useTheme();

  useEffect(() => {
    if (!pathname.startsWith("/app")) {
      setDarkModeUnlocked(true);
      return;
    }
    getDarkModeUnlocked().then(setDarkModeUnlocked);
  }, [pathname, setDarkModeUnlocked]);

  return null;
}
