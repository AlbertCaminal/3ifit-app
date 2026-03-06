-- Eliminar team_id de profiles: el departamento es el equipo
ALTER TABLE public.profiles DROP COLUMN IF EXISTS team_id;
