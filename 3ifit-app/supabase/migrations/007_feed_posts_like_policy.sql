-- Permitir a usuarios autenticados incrementar likes en feed_posts
CREATE POLICY "Authenticated can update feed post likes"
ON public.feed_posts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
