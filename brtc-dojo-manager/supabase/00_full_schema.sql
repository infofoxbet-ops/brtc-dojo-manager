-- ==============================================================================
-- TANO KARATE GESTIONALE (BRTC DOJO MANAGER) - SCHEMA DATABASE COMPLETO
-- Istruzioni: Incolla questo intero script nel "SQL Editor" del tuo nuovo Supabase
-- e clicca su "Run" (in basso a destra).
-- ==============================================================================

-- 1. ORGANIZZAZIONI & SEDI (PALESTRE)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  cap TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_locations_org ON locations(organization_id);

-- 2. RUOLI UTENTE & ORGANIZZAZIONE
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super-admin', 'instructor', 'parent')),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, organization_id)
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Helper functions per RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT (SELECT auth.jwt()) ->> 'user_role'
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT ((SELECT auth.jwt()) ->> 'organization_id')::UUID
$$;

-- 3. ANAGRAFICA ATLETI
CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES auth.users(id),
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F', 'other')),
  fiscal_code TEXT,
  photo_url TEXT,
  medical_cert_expiry DATE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  weight NUMERIC(5,2),
  height INTEGER,
  belt_category TEXT,
  gym_branch TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_athletes_org ON athletes(organization_id);
CREATE INDEX IF NOT EXISTS idx_athletes_parent ON athletes(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_athletes_location ON athletes(location_id);
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- 4. REGISTRO PRESENZE
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'excused')) DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(athlete_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_org ON attendance(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_athlete ON attendance(athlete_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 5. TORNEI E GARE
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tournaments_org ON tournaments(organization_id);
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS tournament_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('kata', 'kumite')),
  gender TEXT CHECK (gender IN ('M', 'F', 'mixed')),
  age_group TEXT,
  weight_category TEXT,
  belt_category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_categories_tournament ON tournament_categories(tournament_id);
ALTER TABLE tournament_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES tournament_categories(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, athlete_id)
);
CREATE INDEX IF NOT EXISTS idx_participants_cat ON tournament_participants(category_id);
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY,
  tournament_id UUID NOT NULL,
  category_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  athlete_a_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  athlete_b_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  score_a INTEGER,
  score_b INTEGER,
  winner_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  next_match_id UUID,
  is_bye BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_matches_org ON tournament_matches(organization_id);
CREATE INDEX IF NOT EXISTS idx_matches_cat ON tournament_matches(category_id);
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

-- 6. ESAMI E PASSAGGI DI CINTURA
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_org ON exam_sessions(organization_id);
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS exam_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  target_belt TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'passed', 'failed', 'postponed')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, athlete_id)
);
CREATE INDEX IF NOT EXISTS idx_exam_candidates_session ON exam_candidates(session_id);
ALTER TABLE exam_candidates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS athlete_belt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  old_belt TEXT,
  new_belt TEXT NOT NULL,
  promotion_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_belt_history_athlete ON athlete_belt_history(athlete_id);
ALTER TABLE athlete_belt_history ENABLE ROW LEVEL SECURITY;
