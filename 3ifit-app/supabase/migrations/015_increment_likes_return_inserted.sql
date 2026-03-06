-- Modificar increment_feed_post_likes para indicar si se insertó un like nuevo
-- Retorna: positivo = nuevo count (se insertó), -1 = no autenticado, -2 = ya había dado like

CREATE OR REPLACE FUNCTION public.increment_feed_post_likes(post_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
  uid UUID;
  pid UUID := post_id;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN -1;
  END IF;

  -- Si ya dio like, devolver -2 (no insertamos)
  IF EXISTS (
    SELECT 1 FROM public.feed_post_likes fpl
    WHERE fpl.user_id = uid AND fpl.post_id = pid
  ) THEN
    RETURN -2;
  END IF;

  -- Insertar el like
  INSERT INTO public.feed_post_likes (user_id, post_id)
  VALUES (uid, pid);

  -- Incrementar y devolver
  UPDATE public.feed_posts
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = pid
  RETURNING likes_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;
