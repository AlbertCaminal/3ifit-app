-- Índices para mejorar rendimiento de consultas frecuentes

-- Feed ordenado por created_at
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON public.feed_posts(created_at DESC);

-- Leaderboard por usuario y temporada
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user_season ON public.leaderboard_entries(user_id, season_id);

-- Rankings por departamento
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id) WHERE department_id IS NOT NULL;
