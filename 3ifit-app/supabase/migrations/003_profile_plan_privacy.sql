-- Plan y privacidad en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT CHECK (plan IN ('basico', 'estandar', 'pro')),
  ADD COLUMN IF NOT EXISTS privacy_individual BOOLEAN DEFAULT false;
