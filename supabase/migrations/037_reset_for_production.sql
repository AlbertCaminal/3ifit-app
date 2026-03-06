-- Reset completo para producción: elimina todos los usuarios y datos de uso.
-- Mantiene: departments, teams, seasons, missions, missions_pool (datos de referencia).
--
-- IMPORTANTE - Storage: Supabase no permite borrar desde storage.objects por SQL.
-- Vacía el bucket "feed-images" manualmente desde:
--   Dashboard > Storage > feed-images > (seleccionar archivos) > Delete

-- Eliminar todos los usuarios (CASCADE borra: profiles, activities, feed_posts,
-- feed_post_likes, leaderboard_entries, weekly_plan_completions, xp_events,
-- user_missions, user_weekly_missions, push_subscriptions)
DELETE FROM auth.users;
