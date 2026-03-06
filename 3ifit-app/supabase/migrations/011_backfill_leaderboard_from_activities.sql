-- Reconstruir leaderboard_entries desde activities (tras el cambio de temporadas)
-- Suma los minutos de cada usuario por temporada según la fecha de la actividad

INSERT INTO public.leaderboard_entries (user_id, season_id, minutes, updated_at)
SELECT
  a.user_id,
  s.id AS season_id,
  SUM(a.minutes)::INTEGER AS minutes,
  now() AS updated_at
FROM public.activities a
CROSS JOIN public.seasons s
WHERE a.created_at::date >= s.start_date
  AND a.created_at::date <= s.end_date
GROUP BY a.user_id, s.id
ON CONFLICT (user_id, season_id)
DO UPDATE SET
  minutes = EXCLUDED.minutes,
  updated_at = EXCLUDED.updated_at;
