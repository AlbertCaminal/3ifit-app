"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRouter } from "next/navigation";
import { ImagePlus, Sparkles } from "lucide-react";
import { useXP } from "@/contexts/XPContext";
import { useTheme } from "@/contexts/ThemeContext";
import { registerActivity } from "./actions";
import { uploadFeedImage } from "./upload";
import { compressImageForUpload } from "./compressImage";
import { uploadFeedImageClient } from "./uploadClient";
import { isValidImageFile } from "./uploadConstants";
import { ACTIVITY_TYPES, TIME_PRESETS } from "./constants";
import { particles } from "@/lib/celebration";

interface XpStatus {
  activityXPClaimed: boolean;
  photoXPClaimed: boolean;
}

interface RegistrarActividadClientProps {
  initialXpStatus: XpStatus;
}

export default function RegistrarActividadClient({
  initialXpStatus,
}: RegistrarActividadClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDarkModeUnlockModal, setShowDarkModeUnlockModal] = useState(false);
  const [activityType, setActivityType] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [shareToFeed, setShareToFeed] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preUploadedUrl, setPreUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showXP } = useXP();
  const { setDarkModeUnlocked } = useTheme();
  const router = useRouter();

  const handleFileSelect = async (file: File) => {
    setPhotoFile(file);
    setPreUploadedUrl(null);
    setShareToFeed(true);
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImageForUpload(file);
      if (!isValidImageFile(compressed)) {
        setError("La imagen debe ser JPEG, PNG o WebP y máximo 10 MB.");
        setPhotoFile(null);
        setPreUploadedUrl(null);
        return;
      }
      const fd = new FormData();
      fd.append("file", compressed);
      let url = await uploadFeedImage(fd);
      if (!url) {
        url = await uploadFeedImageClient(compressed);
      }
      setPreUploadedUrl(url);
    } catch {
      setPreUploadedUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityType || minutes === null) return;
    if (loading) return; // Evitar doble envío

    setError(null);
    setLoading(true);

    try {
      let imageUrl = preUploadedUrl;
      if (photoFile && shareToFeed && !imageUrl) {
        try {
          const compressed = await compressImageForUpload(photoFile);
          const fd = new FormData();
          fd.append("file", compressed);
          imageUrl = await uploadFeedImage(fd);
          if (!imageUrl) imageUrl = await uploadFeedImageClient(compressed);
        } catch {
          setError("No se pudo subir la imagen. Se guardará sin foto.");
        }
      }

      const result = await registerActivity({
        activity_type: activityType,
        minutes,
        share_to_feed: shareToFeed,
        image_url: imageUrl,
      });

      if (result.success) {
        if (result.xpEarned && result.xpEarned > 0) showXP(result.xpEarned);
        if (result.darkModeUnlocked) {
          setDarkModeUnlocked(true);
          setShowDarkModeUnlockModal(true);
          particles();
        } else {
          router.push("/app/home");
        }
        return; // No llamar setLoading(false): el botón sigue deshabilitado hasta navegar
      }
      setError(result.error ?? "Error al registrar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
    setLoading(false); // Solo si hay error, para poder reintentar (el return evita que se ejecute en éxito)
  };

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]">
      <PageHeader
        title="Registrar Actividad"
        subtitle="¿Qué hiciste hoy?"
        backLink={{ href: "/app/home" }}
      />

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-5 overflow-auto px-6 py-7"
      >
        {/* Indicadores XP - visibles de inmediato */}
        <Card variant="muted" className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
            <span
              className={
                initialXpStatus.activityXPClaimed
                  ? "text-[var(--color-text-muted-light)]"
                  : "font-medium text-[var(--color-text-primary)]"
              }
            >
              {initialXpStatus.activityXPClaimed
                ? "Ya ganaste +10 XP hoy por registrar"
                : "Registra hoy para +10 XP"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ImagePlus className="h-4 w-4 text-[var(--color-primary)]" />
            <span
              className={
                initialXpStatus.photoXPClaimed
                  ? "text-[var(--color-text-muted-light)]"
                  : "font-medium text-[var(--color-text-primary)]"
              }
            >
              {initialXpStatus.photoXPClaimed
                ? "Ya ganaste +10 XP hoy por foto"
                : "Añade foto para +10 XP extra"}
            </span>
          </div>
        </Card>

        {/* Grid de actividades */}
        <div className="grid grid-cols-3 gap-2.5">
          {ACTIVITY_TYPES.map((t) => {
            const isSelected =
              activityType !== null && activityType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setActivityType(t.value)}
                className={`btn-card relative aspect-square overflow-hidden rounded-[20px] border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                  isSelected
                    ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]"
                    : "border-[var(--color-border)]"
                }`}
              >
                <Image
                  src={t.image}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="120px"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute inset-0 flex items-end justify-center pb-2 text-[13px] font-semibold text-white">
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tiempo */}
        <Card variant="elevated" padding="lg" className="flex flex-col gap-3">
          <span className="text-[13px] font-normal text-[var(--color-text-muted-light)]">
            Tiempo
          </span>
          <div className="grid grid-cols-4 gap-2.5">
            {TIME_PRESETS.map((m) => {
              const isSelected = minutes !== null && minutes === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutes(m)}
                  className={`btn-card flex items-center justify-center rounded-xl border-2 py-4 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] font-semibold text-white"
                      : "border-[var(--color-border)] bg-[var(--color-bg-muted)] font-normal text-[var(--color-text-primary)]"
                  }`}
                >
                  {m} min
                </button>
              );
            })}
          </div>
        </Card>

        {/* Añadir foto */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[var(--color-text-muted-light)]">
            ¿Quieres compartir una foto con la comunidad?
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`btn-card flex items-center justify-center gap-2 rounded-xl border-2 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
              photoFile
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                : "border-[var(--color-border)] bg-[var(--color-bg-muted)]"
            }`}
          >
            <ImagePlus
              className={`h-5 w-5 ${photoFile ? "text-white" : "text-[var(--color-text-muted-light)]"}`}
              strokeWidth={1.5}
            />
            <span
              className={`text-sm font-medium ${
                photoFile
                  ? "text-white"
                  : "text-[var(--color-text-muted-light)]"
              }`}
            >
              {uploading
                ? "Subiendo..."
                : photoFile
                  ? preUploadedUrl
                    ? "Foto lista"
                    : "Foto seleccionada"
                  : "Añadir Foto (Opcional)"}
            </span>
          </button>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        {showDarkModeUnlockModal && (
          <div
            role="presentation"
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="dark-unlock-title"
              className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-xl"
            >
              <h3
                id="dark-unlock-title"
                className="text-lg font-bold text-[var(--color-text-primary)]"
              >
                ¡Modo oscuro desbloqueado!
              </h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Has registrado tu primera actividad. Ya puedes activar el modo
                oscuro en Perfil → Configuración.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowDarkModeUnlockModal(false);
                  router.push("/app/home");
                }}
                className="btn-primary mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary)] text-base font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2.5 pt-2 pb-1">
          <button
            type="submit"
            disabled={loading || !activityType || minutes === null}
            className="btn-primary flex h-14 w-full items-center justify-center rounded-full bg-[var(--color-primary)] text-[17px] font-semibold text-white shadow-[var(--shadow-button-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:opacity-50 disabled:transform-none"
          >
            {loading ? "Guardando..." : "¡Listo!"}
          </button>
        </div>
      </form>
    </div>
  );
}
