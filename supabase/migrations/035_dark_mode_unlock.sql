-- Modo oscuro desbloqueable tras primera actividad

-- 1. Columna en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dark_mode_unlocked BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.dark_mode_unlocked IS 'Desbloqueado al registrar la primera actividad. Permite usar modo oscuro.';

-- 2. Usuarios que ya tienen actividades: desbloquear
UPDATE public.profiles p
SET dark_mode_unlocked = true
WHERE EXISTS (SELECT 1 FROM public.activities a WHERE a.user_id = p.id);

-- 3. Actualizar register_activity_complete: desbloquear en primera actividad
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
  v_first_activity BOOLEAN := false;
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

  -- 2. Actualizar profile (minutes_total) y desbloquear modo oscuro si es primera actividad
  v_first_activity := (SELECT COUNT(*) FROM public.activities WHERE user_id = uid) = 1;
  UPDATE public.profiles
  SET minutes_total = COALESCE(minutes_total, 0) + p_minutes,
      dark_mode_unlocked = COALESCE(dark_mode_unlocked, false) OR v_first_activity,
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
    'xpEarned', CASE WHEN v_xp_earned > 0 THEN v_xp_earned ELSE NULL END,
    'firstActivityUnlocked', v_first_activity
  );
END;
$$;
