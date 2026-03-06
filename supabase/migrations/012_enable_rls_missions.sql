-- Habilitar RLS en missions (la política ya existe en 001_initial_schema.sql)
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
