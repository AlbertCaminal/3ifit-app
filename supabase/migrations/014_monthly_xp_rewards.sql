-- Procesar recompensas XP mensuales
-- Llamar el día 1 de cada mes para el mes anterior
-- Ejemplo: process_monthly_xp_rewards('2025-02') para febrero 2025

CREATE OR REPLACE FUNCTION public.process_monthly_xp_rewards(p_year_month TEXT)
RETURNS TABLE(user_id UUID, reward_type TEXT, amount INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start DATE;
  v_month_end DATE;
  v_winning_dept_id UUID;
  v_top3_ids UUID[];
  v_user RECORD;
  v_week_start DATE;
  v_weeks_required DATE[];
  v_has_all BOOLEAN;
  v_already_awarded BOOLEAN;
  i INT;
BEGIN
  -- Parsear mes: '2025-02' -> 2025-02-01 y 2025-02-28/29
  v_month_start := (p_year_month || '-01')::DATE;
  v_month_end := (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Obtener los 4 lunes del mes (semanas que cuentan para racha perfecta)
  v_week_start := date_trunc('month', v_month_start)::DATE;
  IF extract(DOW FROM v_week_start) != 1 THEN
    v_week_start := v_week_start + (8 - extract(DOW FROM v_week_start)::INT) % 7;
  END IF;
  v_weeks_required := ARRAY[
    v_week_start,
    v_week_start + 7,
    v_week_start + 14,
    v_week_start + 21
  ];

  -- 1. Racha perfecta: +50 XP a usuarios con las 4 semanas del mes completadas
  FOR v_user IN
    SELECT wpc.user_id
    FROM weekly_plan_completions wpc
    WHERE wpc.week_start = ANY(v_weeks_required)
    GROUP BY wpc.user_id
    HAVING COUNT(DISTINCT wpc.week_start) = 4
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM xp_events
      WHERE xp_events.user_id = v_user.user_id
        AND event_type = 'perfect_streak'
        AND metadata->>'month' = p_year_month
    ) INTO v_already_awarded;

    IF NOT v_already_awarded THEN
      PERFORM award_xp(v_user.user_id, 'perfect_streak', 50, jsonb_build_object('month', p_year_month));
      user_id := v_user.user_id;
      reward_type := 'perfect_streak';
      amount := 50;
      RETURN NEXT;
    END IF;
  END LOOP;

  -- 2. Equipo gana: +200 XP a todos los miembros del departamento con más minutos
  SELECT top.department_id INTO v_winning_dept_id
  FROM (
    SELECT p.department_id, SUM(a.minutes) AS total
    FROM activities a
    JOIN profiles p ON p.id = a.user_id
    WHERE a.created_at >= v_month_start
      AND a.created_at < v_month_end + INTERVAL '1 day'
      AND p.department_id IS NOT NULL
    GROUP BY p.department_id
    ORDER BY total DESC
    LIMIT 1
  ) top;

  IF v_winning_dept_id IS NOT NULL THEN
    FOR v_user IN
      SELECT id FROM profiles WHERE department_id = v_winning_dept_id
    LOOP
      SELECT EXISTS (
        SELECT 1 FROM xp_events
        WHERE xp_events.user_id = v_user.id
          AND event_type = 'team_win'
          AND metadata->>'month' = p_year_month
      ) INTO v_already_awarded;

      IF NOT v_already_awarded THEN
        PERFORM award_xp(v_user.id, 'team_win', 200, jsonb_build_object('month', p_year_month));
        user_id := v_user.id;
        reward_type := 'team_win';
        amount := 200;
        RETURN NEXT;
      END IF;
    END LOOP;
  END IF;

  -- 3. Top 3 individual: +100 XP
  SELECT ARRAY_AGG(uid) INTO v_top3_ids
  FROM (
    SELECT a.user_id AS uid
    FROM activities a
    WHERE a.created_at >= v_month_start
      AND a.created_at < v_month_end + INTERVAL '1 day'
    GROUP BY a.user_id
    ORDER BY SUM(a.minutes) DESC
    LIMIT 3
  ) sub;

  IF v_top3_ids IS NOT NULL THEN
    FOR i IN 1..array_length(v_top3_ids, 1) LOOP
      SELECT EXISTS (
        SELECT 1 FROM xp_events
        WHERE xp_events.user_id = v_top3_ids[i]
          AND event_type = 'top3'
          AND metadata->>'month' = p_year_month
      ) INTO v_already_awarded;

      IF NOT v_already_awarded THEN
        PERFORM award_xp(v_top3_ids[i], 'top3', 100, jsonb_build_object('month', p_year_month));
        user_id := v_top3_ids[i];
        reward_type := 'top3';
        amount := 100;
        RETURN NEXT;
      END IF;
    END LOOP;
  END IF;

  RETURN;
END;
$$;

-- Para ejecutar manualmente: SELECT * FROM process_monthly_xp_rewards('2025-02');
-- Para cron: Supabase Dashboard -> Database -> Extensions -> pg_cron
-- O crear un cron job: SELECT cron.schedule('monthly-xp', '0 9 1 * *', $$SELECT * FROM process_monthly_xp_rewards(to_char(now() - interval '1 month', 'YYYY-MM'))$$);
