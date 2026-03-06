-- Tabla para registrar qué usuario ha dado like a cada post (un like por usuario y post)
CREATE TABLE IF NOT EXISTS public.feed_post_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE public.feed_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read likes" ON public.feed_post_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert own like" ON public.feed_post_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Modificar la función para verificar si ya dio like antes de incrementar
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

  -- Si ya dio like, devolver el count actual sin incrementar
  IF EXISTS (
    SELECT 1 FROM public.feed_post_likes fpl
    WHERE fpl.user_id = uid AND fpl.post_id = pid
  ) THEN
    SELECT COALESCE(likes_count, 0) INTO new_count
    FROM public.feed_posts WHERE id = pid;
    RETURN new_count;
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
