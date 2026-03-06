-- Notificaciones cron: racha en riesgo y ranking
-- 1. Columna para guardar el último rank del departamento notificado
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department_rank_last_notified INTEGER;

COMMENT ON COLUMN public.profiles.department_rank_last_notified IS 'Último puesto del departamento cuando enviamos notificación de ranking. Para detectar cambios.';

-- 2. Función get_home_data_for_cron: igual que get_home_data pero sin check auth.uid()
--    (el cron usa service_role, auth.uid() es null)
CREATE OR REPLACE FUNCTION public.get_home_data_for_cron(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_today_start TIMESTAMPTZ;
  v_week_start DATE;
  v_last_week_start DATE;
  v_last_week_end TIMESTAMPTZ;
  v_today_minutes INTEGER := 0;
  v_days_completed INTEGER := 0;
  v_days_total INTEGER := 3;
  v_today_goal INTEGER := 30;
  v_xp_earned INTEGER;
  v_existing_last BOOLEAN;
  v_existing_current BOOLEAN;
  v_last_week_days INTEGER := 0;
  v_plan TEXT;
  v_perfect_streak INTEGER := 0;
  v_expected DATE;
  v_week_exists BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_today_start := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_week_start := (date_trunc('week', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')::DATE;
  v_last_week_start := v_week_start - 7;
  v_last_week_end := (v_week_start::TIMESTAMPTZ AT TIME ZONE 'UTC') - INTERVAL '1 second';

  SELECT p.avatar_url, p.full_name, p.plan, p.level, p.department_id, d.name AS department_name
  INTO v_profile
  FROM profiles p
  LEFT JOIN departments d ON p.department_id = d.id
  WHERE p.id = p_user_id;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  v_plan := COALESCE(v_profile.plan, 'estandar');
  v_days_total := CASE v_plan WHEN 'basico' THEN 2 WHEN 'estandar' THEN 3 WHEN 'pro' THEN 5 ELSE 3 END;
  v_today_goal := CASE v_plan WHEN 'basico' THEN 15 WHEN 'estandar' THEN 30 WHEN 'pro' THEN 30 ELSE 30 END;

  SELECT COALESCE(SUM(minutes), 0)::INTEGER INTO v_today_minutes
  FROM activities
  WHERE user_id = p_user_id AND created_at >= v_today_start;

  SELECT COUNT(DISTINCT (created_at AT TIME ZONE 'UTC')::DATE)::INTEGER INTO v_days_completed
  FROM activities
  WHERE user_id = p_user_id
    AND created_at >= v_week_start::TIMESTAMPTZ
    AND created_at < (v_week_start + 7)::TIMESTAMPTZ;

  SELECT EXISTS (
    SELECT 1 FROM weekly_plan_completions
    WHERE user_id = p_user_id AND week_start = v_last_week_start
  ) INTO v_existing_last;

  IF NOT v_existing_last THEN
    SELECT COUNT(DISTINCT (created_at AT TIME ZONE 'UTC')::DATE)::INTEGER INTO v_last_week_days
    FROM activities
    WHERE user_id = p_user_id
      AND created_at >= v_last_week_start::TIMESTAMPTZ
      AND created_at <= v_last_week_end;

    IF v_last_week_days >= v_days_total THEN
      INSERT INTO weekly_plan_completions (user_id, week_start, plan)
      VALUES (p_user_id, v_last_week_start, v_plan)
      ON CONFLICT (user_id, week_start) DO NOTHING;

      v_xp_earned := CASE v_plan WHEN 'basico' THEN 50 WHEN 'estandar' THEN 75 WHEN 'pro' THEN 100 ELSE 75 END;
      PERFORM award_xp(p_user_id, 'weekly_plan'::xp_event_type, v_xp_earned, NULL);
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM weekly_plan_completions
    WHERE user_id = p_user_id AND week_start = v_week_start
  ) INTO v_existing_current;

  IF NOT v_existing_current AND v_days_completed >= v_days_total THEN
    INSERT INTO weekly_plan_completions (user_id, week_start, plan)
    VALUES (p_user_id, v_week_start, v_plan)
    ON CONFLICT (user_id, week_start) DO NOTHING;

    v_xp_earned := CASE v_plan WHEN 'basico' THEN 50 WHEN 'estandar' THEN 75 WHEN 'pro' THEN 100 ELSE 75 END;
    PERFORM award_xp(p_user_id, 'weekly_plan'::xp_event_type, v_xp_earned, NULL);
  END IF;

  IF v_days_completed >= v_days_total OR v_existing_current THEN
    v_expected := v_week_start;
  ELSE
    v_expected := v_last_week_start;
  END IF;

  LOOP
    SELECT EXISTS (
      SELECT 1 FROM weekly_plan_completions
      WHERE user_id = p_user_id AND week_start = v_expected
    ) INTO v_week_exists;

    IF NOT v_week_exists THEN
      EXIT;
    END IF;

    v_perfect_streak := v_perfect_streak + 1;
    v_expected := v_expected - 7;

    IF v_perfect_streak >= 104 THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'avatar_url', v_profile.avatar_url,
    'full_name', v_profile.full_name,
    'plan', v_profile.plan,
    'level', COALESCE(v_profile.level, 1),
    'department_name', v_profile.department_name,
    'department_id', v_profile.department_id,
    'today_minutes', v_today_minutes,
    'today_goal', v_today_goal,
    'days_completed', v_days_completed,
    'days_total', v_days_total,
    'perfectStreakWeeks', v_perfect_streak
  );
END;
$$;

-- Solo service_role puede llamar (cron usa service_role)
REVOKE EXECUTE ON FUNCTION public.get_home_data_for_cron(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_data_for_cron(UUID) TO service_role;
