-- RPC para contar likes de la misión social_5 (evita problemas de formato/fechas en el cliente)
CREATE OR REPLACE FUNCTION public.count_social_5_likes(p_week_start_ts TIMESTAMPTZ, p_week_end_ts TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::INTEGER, 0)
  FROM feed_post_likes
  WHERE user_id = auth.uid()
  AND created_at >= p_week_start_ts
  AND created_at < p_week_end_ts;
$$;

GRANT EXECUTE ON FUNCTION public.count_social_5_likes(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
