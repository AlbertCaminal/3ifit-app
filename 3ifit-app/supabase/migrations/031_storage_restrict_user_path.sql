-- Restringir subida de imágenes a la carpeta del usuario (feed-images/{user_id}/*)
-- Reemplaza la política anterior que permitía subir a cualquier path

DROP POLICY IF EXISTS "Authenticated can upload feed images" ON storage.objects;

CREATE POLICY "Authenticated can upload feed images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feed-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
