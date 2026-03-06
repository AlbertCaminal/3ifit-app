-- Reasignar misiones cuando el usuario sube de nivel (no solo cada lunes)

-- Función que asegura misiones correctas para el nivel actual del usuario.
-- Si las misiones existentes son de un nivel distinto, las borra y reasigna.
CREATE OR REPLACE FUNCTION public.ensure_weekly_missions(p_user_id UUID, p_week_start DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_level INTEGER;
  v_need_reassign BOOLEAN := FALSE;
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

  -- ¿Hay misiones de esta semana que NO correspondan al nivel actual?
  SELECT EXISTS (
    SELECT 1 FROM user_weekly_missions uwm
    JOIN missions_pool mp ON mp.id = uwm.mission_id
    WHERE uwm.user_id = p_user_id
      AND uwm.week_start = p_week_start
      AND mp.level != v_level
  ) INTO v_need_reassign;

  IF v_need_reassign THEN
    DELETE FROM user_weekly_missions
    WHERE user_id = p_user_id AND week_start = p_week_start;
    PERFORM assign_weekly_missions(p_user_id, p_week_start);
  ELSIF NOT EXISTS (
    SELECT 1 FROM user_weekly_missions
    WHERE user_id = p_user_id AND week_start = p_week_start
  ) THEN
    PERFORM assign_weekly_missions(p_user_id, p_week_start);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_weekly_missions(UUID, DATE) TO authenticated;
