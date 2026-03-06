"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Target, Users, ShieldCheck } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import { PLAN_XP } from "@/lib/plan";
import { completeOnboarding, getDepartments } from "./actions";

type Plan = "basico" | "estandar" | "pro" | null;

interface Department {
  id: string;
  name: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<Plan>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    getDepartments().then(setDepartments);
  }, []);

  const handleSkip = (e: React.MouseEvent) => {
    finishOnboarding(e);
  };

  const handleNext = (e: React.MouseEvent) => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      finishOnboarding(e);
    }
  };

  const finishOnboarding = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isFinishing) return;
    setError(null);
    setIsFinishing(true);

    const goHome = () => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;
      window.location.assign("/app/home");
    };

    const saveAndGo = async () => {
      try {
        const result = await completeOnboarding(
          plan,
          selectedDepartmentId,
          privacyMode,
        );
        if (!result.success) {
          setError(result.error ?? "Error al guardar. Inténtalo de nuevo.");
          setIsFinishing(false);
          return;
        }
        goHome();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
        setIsFinishing(false);
      }
    };

    void saveAndGo();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      {/* Top bar */}
      <div className="flex w-full justify-end px-6 py-5">
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm font-medium text-[var(--color-text-muted-light)]"
        >
          Omitir
        </button>
      </div>

      {/* Step content - scrollable */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-6">
        {step === 1 && (
          <>
            <div className="flex flex-1 flex-col items-center gap-5 pt-6">
              <div className="relative flex h-24 w-24 justify-center">
                <Image
                  src="/icons/tresipunt_logo.jfif"
                  alt="3iFit"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Bienvenida
              </h2>
              <p className="max-w-[342px] text-center text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
                ¡Hola! En 3iFit no buscamos atletas, buscamos constancia. ¿Cuál
                es tu ritmo actual?
              </p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex flex-1 flex-col gap-5 pt-6">
              <div className="flex justify-center">
                <Target
                  className="text-[var(--color-primary)]"
                  size={100}
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="text-center text-2xl font-bold text-[var(--color-text-primary)]">
                Nivel de Compromiso
              </h2>
              <p className="text-center text-[15px] text-[var(--color-text-secondary)]">
                Elige tu plan para las primeras 3 semanas
              </p>
              <p className="text-center text-[13px] font-medium text-[var(--color-text-muted-light)]">
                Solo podrás cambiar de plan una vez por semana una vez configurado.
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setPlan("basico")}
                  className={`btn-card flex flex-col gap-1 rounded-xl border-2 p-4 text-left ${
                    plan === "basico"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                      : "border-[var(--color-border-light)] bg-[var(--color-bg-muted)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-[var(--color-text-primary)]">
                      Básico
                    </span>
                    <span className="text-[13px] font-medium text-[var(--color-text-muted-light)]">
                      +{PLAN_XP.basico} XP
                    </span>
                  </div>
                  <span className="text-[13px] text-[var(--color-text-secondary)]">
                    2 días/semana de 15 min
                  </span>
                </button>
                <button
                  onClick={() => setPlan("estandar")}
                  className={`btn-card flex flex-col gap-1 rounded-xl border-2 p-4 text-left ${
                    plan === "estandar"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                      : "border-[var(--color-border-light)] bg-[var(--color-bg-muted)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-[var(--color-text-primary)]">
                      Estándar
                    </span>
                    <span className="text-[13px] font-medium text-[var(--color-text-muted-light)]">
                      +{PLAN_XP.estandar} XP
                    </span>
                  </div>
                  <span className="text-[13px] text-[var(--color-text-secondary)]">
                    3 días/semana de 30 min
                  </span>
                </button>
                <button
                  onClick={() => setPlan("pro")}
                  className={`btn-card flex flex-col gap-1 rounded-xl border-2 p-4 text-left ${
                    plan === "pro"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                      : "border-[var(--color-border-light)] bg-[var(--color-bg-muted)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-[var(--color-text-primary)]">
                      Pro
                    </span>
                    <span className="text-[13px] font-medium text-[var(--color-text-muted-light)]">
                      +{PLAN_XP.pro} XP
                    </span>
                  </div>
                  <span className="text-[13px] text-[var(--color-text-secondary)]">
                    5 días/semana de 30 min
                  </span>
                </button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex flex-1 flex-col gap-5 pt-6">
              <div className="flex justify-center">
                <Users
                  className="text-[var(--color-primary)]"
                  size={100}
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="text-center text-2xl font-bold text-[var(--color-text-primary)]">
                Tu equipo
              </h2>
              <p className="text-center text-[15px] text-[var(--color-text-secondary)]">
                ¿A qué equipo perteneces?
              </p>
              <p className="text-center text-[13px] text-[var(--color-text-muted-light)]">
                Solo podrás cambiar de departamento una vez por semana una vez configurado.
              </p>
              <div className="flex flex-col gap-2">
                {departments.slice(0, 6).map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDepartmentId(dept.id)}
                    className={`btn-card flex items-center justify-between rounded-xl border-2 px-4 py-2.5 text-left ${
                      selectedDepartmentId === dept.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                        : "border-[var(--color-border-light)] bg-[var(--color-bg-muted)]"
                    }`}
                  >
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {dept.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex flex-1 flex-col gap-5 pt-6">
              <div className="flex justify-center">
                <ShieldCheck
                  className="text-[var(--color-primary)]"
                  size={100}
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="text-center text-2xl font-bold text-[var(--color-text-primary)]">
                Privacidad
              </h2>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-card)] p-4">
                <p className="flex-1 text-sm text-[var(--color-text-primary)]">
                  Quiero que mi actividad individual sea privada (no aparecerá
                  ni en el ranking individual ni en la comunidad)
                </p>
                <Toggle
                  checked={privacyMode}
                  onChange={() => setPrivacyMode(!privacyMode)}
                  uncheckedBg="var(--color-bg-muted)"
                />
              </div>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Bottom fixed: dots + button - siempre en la misma posición */}
      <div className="shrink-0 px-6 pt-4 pb-8">
        <div className="flex justify-center gap-2 pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded ${
                step === i
                  ? "bg-[var(--color-primary)]"
                  : "bg-[var(--color-bg-muted)]"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleNext}
          disabled={
            (step === 2 && !plan) ||
            (step === 3 && !selectedDepartmentId) ||
            isFinishing
          }
          className={`flex h-[60px] w-full items-center justify-center rounded-full text-base font-semibold text-white ${
            (step === 2 && !plan) || (step === 3 && !selectedDepartmentId)
              ? "cursor-not-allowed bg-[var(--color-primary)]/50"
              : isFinishing
                ? "bg-[var(--color-primary)]/80"
                : "btn-primary bg-[var(--color-primary)]"
          }`}
        >
          {isFinishing ? "Cargando…" : step === 4 ? "Comenzar" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}
