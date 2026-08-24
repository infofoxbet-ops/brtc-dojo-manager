-- ============================================
-- EXAMS & BELT ADVANCEMENTS
-- ============================================

-- 1. Sessioni d'Esame
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

CREATE POLICY "Super admin full access" ON exam_sessions
FOR ALL TO authenticated
USING (public.get_user_role() = 'super-admin');

CREATE POLICY "Instructor org access" ON exam_sessions
FOR ALL TO authenticated
USING (
  public.get_user_role() = 'instructor'
  AND organization_id = public.get_user_org_id()
);


-- 2. Candidati all'Esame
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
CREATE INDEX IF NOT EXISTS idx_exam_candidates_athlete ON exam_candidates(athlete_id);

ALTER TABLE exam_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access" ON exam_candidates
FOR ALL TO authenticated
USING (public.get_user_role() = 'super-admin');

CREATE POLICY "Instructor candidates access" ON exam_candidates
FOR ALL TO authenticated
USING (
  public.get_user_role() = 'instructor'
  AND EXISTS (
    SELECT 1 FROM exam_sessions s
    WHERE s.id = session_id
    AND s.organization_id = public.get_user_org_id()
  )
);


-- 3. Storico Cinture Atleta
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

CREATE POLICY "Super admin full access" ON athlete_belt_history
FOR ALL TO authenticated
USING (public.get_user_role() = 'super-admin');

CREATE POLICY "Instructor belt history access" ON athlete_belt_history
FOR SELECT TO authenticated
USING (
  public.get_user_role() = 'instructor'
  AND EXISTS (
    SELECT 1 FROM athletes a
    WHERE a.id = athlete_id
    AND a.organization_id = public.get_user_org_id()
  )
);

CREATE POLICY "Parent belt history access" ON athlete_belt_history
FOR SELECT TO authenticated
USING (
  public.get_user_role() = 'parent'
  AND EXISTS (
    SELECT 1 FROM athletes a
    WHERE a.id = athlete_id
    AND a.parent_user_id = (SELECT auth.uid())
  )
);
