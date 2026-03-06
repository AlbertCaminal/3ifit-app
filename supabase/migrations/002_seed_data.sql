-- Datos semilla para desarrollo (ejecutar después de 001_initial_schema.sql)

-- Departments
INSERT INTO public.departments (name) VALUES 
  ('Ventas'),
  ('Soporte'),
  ('Desarrollo Externo'),
  ('EdTech Solutions'),
  ('Marketing'),
  ('IT');

-- Season
INSERT INTO public.seasons (name, start_date, end_date) VALUES 
  ('Temporada de Invierno', '2025-01-01', '2025-03-31');

-- Missions
INSERT INTO public.missions (title, description, reward, league, icon, type, target_value) VALUES 
  ('Cumple tu Plan Semanal (5 días)', 'Completa 5 días de actividad', 'Ticket extra para el sorteo', 'Plata', 'calendar-check', 'weekly_plan', 5),
  ('Explorador: Registra tres actividades nuevas', 'Prueba 3 tipos de actividad diferentes', 'Ticket extra para el sorteo', 'Plata', 'sparkles', 'explorer', 3),
  ('Consistencia: Mantén 5 días seguidos de actividad', 'Actividad durante 5 días consecutivos', 'Ticket extra para el sorteo', 'Plata', 'flame', 'streak', 5),
  ('Compañero: Haz una actividad con un compañero', 'Realiza una actividad en equipo', 'Puntos dobles para el ranking', 'Plata', 'users', 'buddy', 1);
