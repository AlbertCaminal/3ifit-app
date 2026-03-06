-- Función para incrementar likes de forma atómica (evita condiciones de carrera)
CREATE OR REPLACE FUNCTION public.increment_feed_post_likes(post_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.feed_posts
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = post_id
  RETURNING likes_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$;

-- Permitir a usuarios autenticados ejecutar la función
GRANT EXECUTE ON FUNCTION public.increment_feed_post_likes(UUID) TO authenticated;
