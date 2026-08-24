-- ============================================
-- ATTENDANCE
-- ============================================
CREATE TABLE attendance (
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

CREATE INDEX idx_attendance_org ON attendance(organization_id);
CREATE INDEX idx_attendance_athlete ON attendance(athlete_id);
CREATE INDEX idx_attendance_date ON attendance(date);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Super-admin sees everything
CREATE POLICY "Super admin full access" ON attendance
FOR ALL TO authenticated
USING (public.get_user_role() = 'super-admin');

-- Instructors see their org's attendance
CREATE POLICY "Instructor org access" ON attendance
FOR SELECT TO authenticated
USING (
  public.get_user_role() = 'instructor'
  AND organization_id = public.get_user_org_id()
);

-- Parents see only their children's attendance
CREATE POLICY "Parent sees children attendance" ON attendance
FOR SELECT TO authenticated
USING (
  public.get_user_role() = 'parent'
  AND athlete_id IN (
    SELECT id FROM athletes WHERE parent_user_id = (SELECT auth.uid())
  )
);
