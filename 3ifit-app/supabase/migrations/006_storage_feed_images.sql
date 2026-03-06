-- Bucket "feed-images" para fotos del muro de comunidad
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-images', 'feed-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas: usuarios autenticados pueden subir imágenes
CREATE POLICY "Authenticated can upload feed images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feed-images');

-- Políticas: cualquiera puede leer (bucket público)
CREATE POLICY "Public read feed images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'feed-images');
