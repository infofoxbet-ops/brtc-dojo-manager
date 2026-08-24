-- ============================================
-- ORGANIZATIONS & LOCATIONS
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE locations (
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
CREATE INDEX idx_locations_org ON locations(organization_id);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super-admin', 'instructor', 'parent')),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Custom Access Token Hook: injects role into JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims JSONB;
  user_role TEXT;
  user_org_id UUID;
BEGIN
  SELECT role, organization_id INTO user_role, user_org_id
  FROM public.user_roles
  WHERE user_id = (event ->> 'user_id')::UUID
  LIMIT 1;

  claims := event -> 'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    claims := jsonb_set(claims, '{organization_id}', to_jsonb(user_org_id));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"parent"'::jsonb);
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT SELECT ON TABLE public.user_roles TO supabase_auth_admin;

-- ============================================
-- HELPER: GET USER ROLE / ORG FROM JWT
-- ============================================
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

-- ============================================
-- ATHLETES
-- ============================================
CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  parent_user_id UUID REFERENCES auth.users(id),
  location_id UUID REFERENCES locations(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F', 'other')),
  fiscal_code TEXT,
  photo_url TEXT,
  medical_cert_expiry DATE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_athletes_org ON athletes(organization_id);
CREATE INDEX idx_athletes_parent ON athletes(parent_user_id);
CREATE INDEX idx_athletes_location ON athletes(location_id);

ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- Super-admin sees everything
CREATE POLICY "Super admin full access" ON athletes
FOR ALL TO authenticated
USING (public.get_user_role() = 'super-admin');

-- Instructors see their org's athletes
CREATE POLICY "Instructor org access" ON athletes
FOR SELECT TO authenticated
USING (
  public.get_user_role() = 'instructor'
  AND organization_id = public.get_user_org_id()
);

-- Parents see only their children
CREATE POLICY "Parent sees children" ON athletes
FOR SELECT TO authenticated
USING (
  public.get_user_role() = 'parent'
  AND parent_user_id = (SELECT auth.uid())
);
