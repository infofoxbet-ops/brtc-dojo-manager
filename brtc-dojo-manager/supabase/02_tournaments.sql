-- ============================================
-- TOURNAMENTS (TORNEI)
-- ============================================
CREATE TABLE tournaments (
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

-- ============================================
-- TOURNAMENT CATEGORIES (CATEGORIE DI GARA)
-- ============================================
CREATE TABLE tournament_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- es. "Kata Esordienti M", "Kumite -60kg"
  type TEXT NOT NULL CHECK (type IN ('kata', 'kumite')),
  gender TEXT CHECK (gender IN ('M', 'F', 'mixed')),
  age_group TEXT, -- es. "Esordienti", "Cadetti"
  weight_category TEXT, -- es. "-60kg", "Open"
  belt_category TEXT, -- es. "Bianca-Gialla"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TOURNAMENT PARTICIPANTS (ISCRITTI)
-- ============================================
CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES tournament_categories(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, athlete_id) -- Un atleta non può iscriversi due volte alla stessa categoria
);

-- ============================================
-- TOURNAMENT MATCHES (INCONTRI / TABELLONE)
-- ============================================
CREATE TABLE tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES tournament_categories(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL, -- 1 = Finale, 2 = Semifinale, 3 = Quarti, ecc.
  match_number INTEGER NOT NULL, -- Posizione nel turno
  next_match_id UUID REFERENCES tournament_matches(id), -- L'incontro in cui avanzerà il vincitore
  athlete_a_id UUID REFERENCES athletes(id) ON DELETE SET NULL, -- Può essere NULL (BYE)
  athlete_b_id UUID REFERENCES athletes(id) ON DELETE SET NULL, -- Può essere NULL (BYE)
  winner_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  score_a TEXT,
  score_b TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDICI E SICUREZZA (RLS non necessaria se bypassiamo con adminClient per l'MVP, 
-- ma abilitiamola di base per sicurezza futura)
-- ============================================
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
