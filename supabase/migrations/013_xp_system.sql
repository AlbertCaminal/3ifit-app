-- Sistema de XP y niveles
-- Tablas: xp_events, weekly_plan_completions
-- Función: award_xp
-- Trigger: level desde points

-- Tipo enum para event_type
CREATE TYPE xp_event_type AS ENUM (
  'activity',
  'photo',
  'clap',
  'weekly_plan',
  'perfect_streak',
  'team_win',
  'top3'
);

-- Tabla xp_events (auditoría y verificación de límites)
CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type xp_event_type NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_xp_events_user_type_created ON public.xp_events(user_id, event_type, created_at);
CREATE INDEX idx_xp_events_user_created ON public.xp_events(user_id, created_at DESC);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own xp_events" ON public.xp_events
  FOR SELECT USING (auth.uid() = user_id);

-- Inserciones solo via award_xp (SECURITY DEFINER bypassa RLS)

-- Tabla weekly_plan_completions (para racha perfecta y XP semanal)
CREATE TABLE IF NOT EXISTS public.weekly_plan_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('basico', 'estandar', 'pro')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_plan_user_week ON public.weekly_plan_completions(user_id, week_start DESC);

ALTER TABLE public.weekly_plan_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own weekly_completions" ON public.weekly_plan_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly_completions" ON public.weekly_plan_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Función para otorgar XP (SECURITY DEFINER para poder insertar en xp_events)
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_event_type xp_event_type,
  p_amount INTEGER,
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total INTEGER;
  uid UUID;
BEGIN
  uid := auth.uid();
  -- Solo permitir: usuario otorgándose a sí mismo, o service role (uid NULL)
  IF uid IS NOT NULL AND uid != p_user_id THEN
    RETURN -1;
  END IF;

  INSERT INTO public.xp_events (user_id, event_type, amount, metadata)
  VALUES (p_user_id, p_event_type, p_amount, p_metadata);

  UPDATE public.profiles
  SET points = COALESCE(points, 0) + p_amount,
      updated_at = now()
  WHERE id = p_user_id;

  SELECT COALESCE(points, 0) INTO new_total
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN new_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_xp(UUID, xp_event_type, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(UUID, xp_event_type, INTEGER, JSONB) TO service_role;

-- Trigger para recalcular level desde points
CREATE OR REPLACE FUNCTION public.update_level_from_points()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := CASE
    WHEN COALESCE(NEW.points, 0) >= 10000 THEN 5
    WHEN COALESCE(NEW.points, 0) >= 6000 THEN 4
    WHEN COALESCE(NEW.points, 0) >= 3000 THEN 3
    WHEN COALESCE(NEW.points, 0) >= 1000 THEN 2
    ELSE 1
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_level_from_points ON public.profiles;
CREATE TRIGGER profiles_level_from_points
  BEFORE INSERT OR UPDATE OF points ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_level_from_points();

-- Aplicar nivel actual a perfiles existentes
UPDATE public.profiles
SET level = CASE
  WHEN COALESCE(points, 0) >= 10000 THEN 5
  WHEN COALESCE(points, 0) >= 6000 THEN 4
  WHEN COALESCE(points, 0) >= 3000 THEN 3
  WHEN COALESCE(points, 0) >= 1000 THEN 2
  ELSE 1
END
WHERE level IS NULL OR level < 1 OR level > 5;
