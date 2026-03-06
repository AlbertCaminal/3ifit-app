-- Eliminar temporada antigua
DELETE FROM public.seasons;

-- Temporadas según fechas astronómicas (solsticios y equinoccios, hemisferio norte)
-- Invierno: 21 dic - 20 mar | Primavera: 21 mar - 20 jun | Verano: 21 jun - 22 sep | Otoño: 23 sep - 20 dic

-- Ciclo 2024-2025
INSERT INTO public.seasons (name, start_date, end_date) VALUES 
  ('Invierno', '2024-12-21', '2025-03-20'),
  ('Primavera', '2025-03-21', '2025-06-20'),
  ('Verano', '2025-06-21', '2025-09-22'),
  ('Otoño', '2025-09-23', '2025-12-20');

-- Ciclo 2025-2026
INSERT INTO public.seasons (name, start_date, end_date) VALUES 
  ('Invierno', '2025-12-21', '2026-03-20'),
  ('Primavera', '2026-03-21', '2026-06-20'),
  ('Verano', '2026-06-21', '2026-09-22'),
  ('Otoño', '2026-09-23', '2026-12-20');
