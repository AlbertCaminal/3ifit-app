"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src: string | null | undefined;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Cuando true, fuerza mostrar iniciales en lugar de imagen (por defecto: muestra imagen si existe, iniciales si no) */
  preferInitials?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-22 w-22",
};

const initialSizeClasses = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-5xl",
};

function getInitials(alt?: string): string {
  return alt?.trim().charAt(0)?.toUpperCase() ?? "?";
}

function isGoogleDefaultAvatar(url: string): boolean {
  if (!url.includes("googleusercontent.com")) return false;
  return (
    url.includes("default-user") ||
    url.includes("default_user") ||
    url.includes("/-/default-user") ||
    /\/a\/default-user/i.test(url)
  );
}

export function Avatar({
  src,
  alt = "Avatar",
  size = "md",
  className,
  preferInitials,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = size === "lg" ? "h-[88px] w-[88px]" : sizeClasses[size];
  const isDefaultAvatar = src ? isGoogleDefaultAvatar(src) : false;
  const showImage =
    src && !imageError && !preferInitials && !isDefaultAvatar;

  if (showImage) {
    return (
      <div
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-[var(--color-primary)]",
          sizeClass,
          className,
        )}
      >
        {/* img nativo evita 429 de Google y múltiples peticiones de Next/Image */}
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] text-white",
        sizeClass,
        className,
      )}
    >
      <span
        className={cn(
          "font-semibold leading-none",
          initialSizeClasses[
            size === "lg" ? "lg" : size === "md" ? "md" : "sm"
          ],
        )}
      >
        {getInitials(alt)}
      </span>
    </div>
  );
}
