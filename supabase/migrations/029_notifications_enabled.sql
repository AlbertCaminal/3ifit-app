-- Preferencia de notificaciones en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.profiles.notifications_enabled IS 'Si el usuario tiene activadas las notificaciones (plan semanal, actividad diaria).';
