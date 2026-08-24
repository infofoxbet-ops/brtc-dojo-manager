-- ============================================
-- TOURNAMENT MATCHES
-- ============================================
CREATE TABLE tournament_matches (
  id UUID PRIMARY KEY, -- We generate this client side
  tournament_id UUID NOT NULL, -- references not strict to simplify MVP, or we can add it later
  category_id UUID NOT NULL, -- references not strict
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  athlete_a_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  athlete_b_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  score_a INTEGER,
  score_b INTEGER,
  winner_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  next_match_id UUID, -- self reference handled loosely
  is_bye BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_matches_org ON tournament_matches(organization_id);
CREATE INDEX idx_matches_cat ON tournament_matches(category_id);

ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access" ON tournament_matches
FOR ALL TO authenticated
USING (public.get_user_role() = 'super-admin');

CREATE POLICY "Instructor org access" ON tournament_matches
FOR ALL TO authenticated
USING (
  public.get_user_role() = 'instructor'
  AND organization_id = public.get_user_org_id()
);

CREATE POLICY "Parent sees matches" ON tournament_matches
FOR SELECT TO authenticated
USING (
  public.get_user_role() = 'parent'
);
