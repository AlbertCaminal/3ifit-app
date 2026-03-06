-- Límite: cambiar de plan solo una vez por semana
-- plan_changed_week_start: lunes (YYYY-MM-DD) de la semana en que el usuario cambió de plan por última vez

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_changed_week_start TEXT;

COMMENT ON COLUMN public.profiles.plan_changed_week_start IS 'Lunes (YYYY-MM-DD) de la semana en que el usuario cambió de plan por última vez. Null = nunca ha cambiado desde onboarding.';
