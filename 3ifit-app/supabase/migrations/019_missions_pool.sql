-- Pool de Misiones por nivel: misiones dinámicas (1 fija + 2 aleatorias semanales)

-- Añadir 'mission' al enum xp_event_type
ALTER TYPE xp_event_type ADD VALUE IF NOT EXISTS 'mission';

CREATE TABLE IF NOT EXISTS public.missions_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
  type TEXT NOT NULL CHECK (type IN ('fixed', 'pool')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  target_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_missions_pool_level_type ON public.missions_pool(level, type);

CREATE TABLE IF NOT EXISTS public.user_weekly_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions_pool(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mission_id, week_start)
);

CREATE INDEX idx_user_weekly_missions_user_week ON public.user_weekly_missions(user_id, week_start DESC);

ALTER TABLE public.missions_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read missions_pool" ON public.missions_pool
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read own weekly_missions" ON public.user_weekly_missions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly_missions" ON public.user_weekly_missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly_missions" ON public.user_weekly_missions
  FOR UPDATE USING (auth.uid() = user_id);

-- Seed: misiones fijas (racha) y pool por nivel
INSERT INTO public.missions_pool (level, type, slug, title, xp_reward, target_value) VALUES
-- Nivel 1 Bronce
(1, 'fixed', 'streak_1', 'Completar tu Plan Semanal por primera vez (Racha 1)', 50, 1),
(1, 'pool', 'social_5', 'Dar 5 ánimos en el muro', 20, 5),
(1, 'pool', 'rompehielo', 'Registrar 1 actividad añadiendo una foto', 25, 1),
(1, 'pool', 'explorador', 'Registrar 3 tipos de actividad distintas en la misma semana', 40, 3),
(1, 'pool', 'madrugador', 'Registrar una actividad antes de las 9:00 AM', 25, 1),
(1, 'pool', 'nocturna', 'Registrar una actividad suave después del horario laboral (18:00)', 25, 1),
-- Nivel 2 Plata
(2, 'fixed', 'streak_2', 'Mantener tu Racha Inteligente durante 2 semanas (Racha 2)', 100, 2),
(2, 'pool', 'inter_dept', 'Dar ánimos a 3 compañeros que no sean de tu departamento', 30, 3),
(2, 'pool', 'volumen_90', 'Acumular 90 minutos de actividad total a lo largo de la semana', 50, 90),
(2, 'pool', 'zen', 'Dedicar 15 minutos a yoga, relajación o meditación', 40, 15),
(2, 'pool', 'walk_talk', 'Realizar una reunión o llamada mientras caminas', 40, 1),
-- Nivel 3 Oro
(3, 'fixed', 'streak_4', 'Mantener tu Racha Inteligente durante 4 semanas (Racha 4)', 150, 4),
(3, 'pool', 'mente_sana', 'Registrar una actividad de desconexión de más de 40 minutos', 70, 40),
(3, 'pool', 'fin_semana', 'Registrar una actividad al aire libre durante un sábado o domingo', 60, 1),
(3, 'pool', 'intensidad', 'Registrar una sesión de ejercicio cardiovascular o de fuerza de al menos 20 minutos', 70, 20),
(3, 'pool', 'influencer', 'Recibir al menos 5 ánimos en una foto de tu actividad en el muro', 50, 5),
-- Nivel 4 Platino
(4, 'fixed', 'streak_8', 'Mantener tu Racha Inteligente durante 8 semanas (Racha 8)', 300, 8),
(4, 'pool', 'embajador', 'Subir 3 fotos de actividades distintas al muro en una misma semana', 100, 3),
(4, 'pool', 'maraton_250', 'Alcanzar 250 minutos de actividad acumulada en 7 días', 120, 250),
(4, 'pool', 'multideporte', 'Registrar 4 tipos diferentes de actividad física en la misma semana', 110, 4),
(4, 'pool', 'naturaleza', 'Registrar una ruta de senderismo o actividad al aire libre de más de 2 horas', 120, 120),
(4, 'pool', 'record_personal', 'Superar tu propia marca de minutos de la semana anterior', 130, 1),
-- Nivel 5 Diamante
(5, 'fixed', 'streak_12', 'Mantener tu Racha Inteligente durante 12 semanas (Racha 12)', 600, 12),
(5, 'pool', 'sherpa', 'Repartir 20 ánimos en el muro a lo largo de la semana', 150, 20),
(5, 'pool', '360', 'Completar más de 300 minutos sumando al menos 3 disciplinas deportivas distintas', 200, 300),
(5, 'pool', 'motor_equipo', 'Ser el usuario con más minutos registrados de tu departamento al finalizar el domingo', 200, 1),
(5, 'pool', 'iron_mind', 'Completar tu Plan Semanal en franjas difíciles (antes de 8:00 o después de 20:00)', 180, 1),
(5, 'pool', 'invencible', 'Registrar actividad 5 días diferentes superando 45 min en cada uno', 250, 5)
ON CONFLICT (slug) DO NOTHING;

-- Función para asignar misiones semanales (ejecutar cada lunes o lazy al abrir Misiones)
CREATE OR REPLACE FUNCTION public.assign_weekly_missions(p_user_id UUID, p_week_start DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_level INTEGER;
  v_fixed_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RETURN;
  END IF;

  SELECT COALESCE(level, 1) INTO v_level
  FROM profiles
  WHERE id = p_user_id;

  IF v_level IS NULL THEN
    RETURN;
  END IF;

  -- 1. Insertar misión fija
  SELECT id INTO v_fixed_id
  FROM missions_pool
  WHERE level = v_level AND type = 'fixed'
  LIMIT 1;

  IF v_fixed_id IS NOT NULL THEN
    INSERT INTO user_weekly_missions (user_id, mission_id, week_start)
    VALUES (p_user_id, v_fixed_id, p_week_start)
    ON CONFLICT (user_id, mission_id, week_start) DO NOTHING;
  END IF;

  -- 2. Insertar 2 misiones pool aleatorias
  INSERT INTO user_weekly_missions (user_id, mission_id, week_start)
  SELECT p_user_id, id, p_week_start
  FROM missions_pool
  WHERE level = v_level AND type = 'pool'
  ORDER BY random()
  LIMIT 2
  ON CONFLICT (user_id, mission_id, week_start) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_weekly_missions(UUID, DATE) TO authenticated;
