-- Asegurar que created_at siempre tenga valor en feed_post_likes (para que la misión social_5 cuente correctamente)

-- 1. Corregir filas existentes con created_at NULL
UPDATE public.feed_post_likes
SET created_at = now()
WHERE created_at IS NULL;

-- 2. Hacer la columna NOT NULL
ALTER TABLE public.feed_post_likes
ALTER COLUMN created_at SET NOT NULL;

-- 3. Modificar la función para establecer created_at explícitamente
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

  IF EXISTS (
    SELECT 1 FROM public.feed_post_likes fpl
    WHERE fpl.user_id = uid AND fpl.post_id = pid
  ) THEN
    SELECT COALESCE(likes_count, 0) INTO new_count
    FROM public.feed_posts WHERE id = pid;
    RETURN new_count;
  END IF;

  INSERT INTO public.feed_post_likes (user_id, post_id, created_at)
  VALUES (uid, pid, now());

  UPDATE public.feed_posts
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = pid
  RETURNING likes_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;
