-- Límite: cambiar de departamento solo una vez por semana
-- department_changed_week_start: lunes (YYYY-MM-DD) de la semana en que el usuario cambió de departamento por última vez

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department_changed_week_start TEXT;

COMMENT ON COLUMN public.profiles.department_changed_week_start IS 'Lunes (YYYY-MM-DD) de la semana en que el usuario cambió de departamento por última vez. Null = nunca ha cambiado desde onboarding.';
