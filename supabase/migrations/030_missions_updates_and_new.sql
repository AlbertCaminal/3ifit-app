-- Actualizaciones de misiones existentes + nuevas misiones
-- Cambios solicitados + misiones nuevas propuestas

-- 1. Actualizar títulos de misiones de racha: "Racha Inteligente" → "Racha semanal"
UPDATE public.missions_pool SET title = 'Completar tu Plan Semanal por primera vez (Racha semanal 1)' WHERE slug = 'streak_1';
UPDATE public.missions_pool SET title = 'Mantener tu Racha semanal durante 2 semanas (Racha 2)' WHERE slug = 'streak_2';
UPDATE public.missions_pool SET title = 'Mantener tu Racha semanal durante 4 semanas (Racha 4)' WHERE slug = 'streak_4';
UPDATE public.missions_pool SET title = 'Mantener tu Racha semanal durante 8 semanas (Racha 8)' WHERE slug = 'streak_8';
UPDATE public.missions_pool SET title = 'Mantener tu Racha semanal durante 12 semanas (Racha 12)' WHERE slug = 'streak_12';

-- 2. zen: quitar relajación
UPDATE public.missions_pool SET title = 'Dedicar 15 minutos a yoga o meditación' WHERE slug = 'zen';

-- 3. walk_talk → animos_caminar_correr: dar 5 ánimos en actividades de andar o correr
UPDATE public.missions_pool SET slug = 'animos_caminar_correr', title = 'Dar 5 ánimos en actividades de andar o correr', target_value = 5 WHERE slug = 'walk_talk';

-- 4. mente_sana: especificar actividades (yoga, meditación, estiramientos)
UPDATE public.missions_pool SET title = 'Registrar una actividad de yoga, meditación o estiramientos de más de 40 minutos' WHERE slug = 'mente_sana';

-- 5. fin_semana: actividad en fin de semana (no "al aire libre")
UPDATE public.missions_pool SET title = 'Registrar una actividad en fin de semana' WHERE slug = 'fin_semana';

-- 6. intensidad: especificar actividades (bici, correr, gimnasio, nadar)
UPDATE public.missions_pool SET title = 'Registrar una sesión de bici, correr, gimnasio o nadar de al menos 20 minutos' WHERE slug = 'intensidad';

-- 7. naturaleza: solo senderismo
UPDATE public.missions_pool SET title = 'Registrar una actividad de senderismo de más de 2 horas', target_value = 120 WHERE slug = 'naturaleza';

-- 8. mente_sana: filtrar por yoga, meditation, stretching (actualizar lógica en actions)
-- 9. naturaleza: solo hiking (no walking) - actualizar lógica en actions

-- 10. Añadir activity_id a feed_posts para animos_caminar_correr
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_feed_posts_activity_id ON public.feed_posts(activity_id) WHERE activity_id IS NOT NULL;

-- 11. Actualizar register_activity_complete para guardar activity_id en feed_posts
CREATE OR REPLACE FUNCTION public.register_activity_complete(
  p_activity_type TEXT,
  p_minutes INTEGER,
  p_notes TEXT,
  p_share_to_feed BOOLEAN,
  p_image_url TEXT,
  p_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  v_activity_id UUID;
  v_today DATE;
  v_today_start TIMESTAMPTZ;
  v_tomorrow_start TIMESTAMPTZ;
  v_profile_minutes INTEGER;
  v_season_id UUID;
  v_entry_minutes INTEGER;
  v_has_activity_xp BOOLEAN;
  v_has_photo_xp BOOLEAN;
  v_xp_earned INTEGER := 0;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  IF p_minutes IS NULL OR p_minutes < 1 OR p_minutes > 999 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Minutos inválidos');
  END IF;

  v_today := CURRENT_DATE;
  v_today_start := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_tomorrow_start := v_today_start + INTERVAL '1 day';

  -- 1. Insertar actividad
  INSERT INTO public.activities (user_id, activity_type, minutes, notes, share_to_feed)
  VALUES (uid, p_activity_type, p_minutes, p_notes, COALESCE(p_share_to_feed, false))
  RETURNING id INTO v_activity_id;

  -- 2. Actualizar profile (minutes_total)
  UPDATE public.profiles
  SET minutes_total = COALESCE(minutes_total, 0) + p_minutes,
      updated_at = now()
  WHERE id = uid;

  -- 3. Leaderboard (temporada activa)
  SELECT id INTO v_season_id
  FROM public.seasons
  WHERE start_date <= v_today AND end_date >= v_today
  LIMIT 1;

  IF v_season_id IS NOT NULL THEN
    INSERT INTO public.leaderboard_entries (user_id, season_id, minutes, updated_at)
    VALUES (uid, v_season_id, p_minutes, now())
    ON CONFLICT (user_id, season_id) DO UPDATE SET
      minutes = public.leaderboard_entries.minutes + p_minutes,
      updated_at = now();
  END IF;

  -- 4. Feed post si share_to_feed (con activity_id para misiones)
  IF p_share_to_feed AND p_content IS NOT NULL THEN
    INSERT INTO public.feed_posts (user_id, content, image_url, activity_id)
    VALUES (uid, p_content, p_image_url, v_activity_id);
  END IF;

  -- 5. XP: actividad y foto
  SELECT EXISTS (SELECT 1 FROM xp_events WHERE user_id = uid AND event_type = 'activity'
    AND created_at >= v_today_start AND created_at < v_tomorrow_start)
  INTO v_has_activity_xp;

  SELECT EXISTS (SELECT 1 FROM xp_events WHERE user_id = uid AND event_type = 'photo'
    AND created_at >= v_today_start AND created_at < v_tomorrow_start)
  INTO v_has_photo_xp;

  IF NOT v_has_activity_xp THEN
    PERFORM award_xp(uid, 'activity'::xp_event_type, 10, NULL);
    v_xp_earned := v_xp_earned + 10;
  END IF;

  IF p_image_url IS NOT NULL AND NOT v_has_photo_xp THEN
    PERFORM award_xp(uid, 'photo'::xp_event_type, 10, NULL);
    v_xp_earned := v_xp_earned + 10;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'xpEarned', CASE WHEN v_xp_earned > 0 THEN v_xp_earned ELSE NULL END
  );
END;
$$;

-- 12. RPC para contar ánimos en posts de andar/correr (solo posts con activity_id y tipo walking/running)
CREATE OR REPLACE FUNCTION public.count_animos_caminar_correr(p_week_start_ts TIMESTAMPTZ, p_week_end_ts TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::INTEGER, 0)
  FROM feed_post_likes fpl
  JOIN feed_posts fp ON fp.id = fpl.post_id
  JOIN activities a ON a.id = fp.activity_id AND a.activity_type IN ('walking', 'running')
  WHERE fpl.user_id = auth.uid()
  AND fpl.created_at >= p_week_start_ts
  AND fpl.created_at < p_week_end_ts;
$$;

GRANT EXECUTE ON FUNCTION public.count_animos_caminar_correr(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- 13. Nuevas misiones
INSERT INTO public.missions_pool (level, type, slug, title, xp_reward, target_value) VALUES
-- Nivel 1 Bronce
(1, 'pool', 'consistencia', 'Registrar actividad al menos 3 días distintos en la semana', 30, 3),
(1, 'pool', 'primer_paso', 'Completar tu primera actividad registrada de la semana', 15, 1),
(1, 'pool', 'social_basico', 'Dar ánimos a 2 compañeros distintos', 15, 2),
-- Nivel 2 Plata
(2, 'pool', 'pausa_activa', 'Registrar 3 pausas activas (actividades de 5 a 15 min) en la semana', 35, 3),
(2, 'pool', 'rutina_matinal', 'Registrar actividad antes de las 10:00 en 2 días distintos', 35, 2),
(2, 'pool', 'variedad', 'Registrar 2 tipos de actividad distintos en la misma semana', 30, 2),
-- Nivel 3 Oro
(3, 'pool', 'comunidad', 'Dar ánimos a 5 compañeros distintos', 55, 5),
(3, 'pool', 'constancia', 'Registrar actividad 4 días distintos en la semana', 45, 4),
(3, 'pool', 'desconexion_digital', 'Registrar una actividad de yoga, meditación o estiramientos de al menos 20 minutos', 55, 20),
-- Nivel 4 Platino
(4, 'pool', 'lider_animos', 'Ser uno de los 3 usuarios que más ánimos ha dado en la semana', 90, 1),
(4, 'pool', 'semana_completa', 'Registrar actividad los 5 días laborables', 95, 5),
(4, 'pool', 'doble_sesion', 'Registrar 2 actividades distintas el mismo día', 90, 2),
-- Nivel 5 Diamante
(5, 'pool', 'referente', 'Recibir 10 ánimos en total en tus publicaciones de la semana', 180, 10),
(5, 'pool', 'ultra', 'Registrar una actividad de más de 90 minutos', 150, 90),
(5, 'pool', 'polivalente', 'Completar tu plan semanal con al menos 4 tipos de actividad distintos', 170, 4)
ON CONFLICT (slug) DO NOTHING;
