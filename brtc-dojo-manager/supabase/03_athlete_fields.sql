-- Aggiunta campi fisici e tecnici all'anagrafica atleti
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS belt_category TEXT,
ADD COLUMN IF NOT EXISTS gym_branch TEXT;
