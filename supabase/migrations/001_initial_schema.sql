-- ================================================================
-- RISE HR Portal — Complete Database Schema
-- Run this in your Supabase SQL editor
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. TEAM MEMBERS
-- ================================================================
CREATE TABLE IF NOT EXISTS team_members (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  department    TEXT,
  designation   TEXT,
  avatar_url    TEXT,
  slack_handle  TEXT,
  bio           TEXT,
  join_date     DATE,
  birthday      DATE,
  airtable_id   TEXT UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 2. NATIONAL HOLIDAYS
-- ================================================================
CREATE TABLE IF NOT EXISTS national_holidays (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date       DATE NOT NULL,
  name       TEXT NOT NULL,
  year       INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- ================================================================
-- 3. LEAVE BALANCES
-- ================================================================
CREATE TABLE IF NOT EXISTS leave_balances (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  year             INTEGER NOT NULL,
  pto_total        NUMERIC(4,1) DEFAULT 18,
  pto_used         NUMERIC(4,1) DEFAULT 0,
  wfh_total        NUMERIC(4,1) DEFAULT 12,
  wfh_used         NUMERIC(4,1) DEFAULT 0,
  comp_off_balance NUMERIC(4,1) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);

CREATE TRIGGER leave_balances_updated_at
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 4. LEAVE REQUESTS
-- ================================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('pto', 'wfh', 'comp_off', 'sick', 'casual')),
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  half_day_period  TEXT CHECK (half_day_period IN ('AM', 'PM')),
  total_days       NUMERIC(4,1) NOT NULL,
  reason           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by      UUID REFERENCES team_members(id),
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date),
  CHECK (total_days > 0)
);

CREATE TRIGGER leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Auto-update leave balances when a request is approved
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM NEW.start_date)::INTEGER;
BEGIN
  -- When status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Ensure balance row exists
    INSERT INTO leave_balances (user_id, year) VALUES (NEW.user_id, current_year)
    ON CONFLICT (user_id, year) DO NOTHING;

    IF NEW.type = 'pto' THEN
      UPDATE leave_balances SET pto_used = pto_used + NEW.total_days WHERE user_id = NEW.user_id AND year = current_year;
    ELSIF NEW.type = 'wfh' THEN
      UPDATE leave_balances SET wfh_used = wfh_used + NEW.total_days WHERE user_id = NEW.user_id AND year = current_year;
    ELSIF NEW.type = 'comp_off' THEN
      UPDATE leave_balances SET comp_off_balance = comp_off_balance - NEW.total_days WHERE user_id = NEW.user_id AND year = current_year;
    END IF;
  END IF;

  -- When status changes FROM 'approved' to 'rejected' (reversal)
  IF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    IF OLD.type = 'pto' THEN
      UPDATE leave_balances SET pto_used = GREATEST(0, pto_used - OLD.total_days) WHERE user_id = OLD.user_id AND year = current_year;
    ELSIF OLD.type = 'wfh' THEN
      UPDATE leave_balances SET wfh_used = GREATEST(0, wfh_used - OLD.total_days) WHERE user_id = OLD.user_id AND year = current_year;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leave_balance_auto_update
  AFTER UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_leave_balance();

-- ================================================================
-- 5. ANNOUNCEMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id  UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body_html  TEXT NOT NULL,
  body_json  JSONB DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  is_pinned  BOOLEAN DEFAULT FALSE,
  edited_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned);

-- ================================================================
-- 6. ANNOUNCEMENT REACTIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS announcement_reactions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('knowledge', 'love')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, type)
);

-- ================================================================
-- 7. ANNOUNCEMENT REPLIES
-- ================================================================
CREATE TABLE IF NOT EXISTS announcement_replies (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  mentions   TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 8. AUDIT LOG (immutable)
-- ================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id   UUID REFERENCES team_members(id),
  event_type TEXT NOT NULL,
  payload    JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
ALTER TABLE team_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE national_holidays  ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_replies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log          ENABLE ROW LEVEL SECURITY;

-- Helper: get team_member id for current auth user
CREATE OR REPLACE FUNCTION get_my_team_member_id()
RETURNS UUID AS $$
  SELECT id FROM team_members WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: is current user admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email' AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- ---- team_members ----
CREATE POLICY "All authenticated can read team" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile fields" ON team_members FOR UPDATE TO authenticated USING (email = auth.jwt() ->> 'email') WITH CHECK (email = auth.jwt() ->> 'email');
CREATE POLICY "Admins can update any member" ON team_members FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Service role can insert" ON team_members FOR INSERT TO authenticated WITH CHECK (true);

-- ---- national_holidays ----
CREATE POLICY "All authenticated can read holidays" ON national_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage holidays" ON national_holidays FOR ALL TO authenticated USING (is_admin());

-- ---- leave_requests ----
CREATE POLICY "Members see own requests" ON leave_requests FOR SELECT TO authenticated USING (user_id = get_my_team_member_id() OR is_admin());
CREATE POLICY "Members can create own requests" ON leave_requests FOR INSERT TO authenticated WITH CHECK (user_id = get_my_team_member_id());
CREATE POLICY "Admins can update any request" ON leave_requests FOR UPDATE TO authenticated USING (is_admin() OR user_id = get_my_team_member_id());

-- ---- leave_balances ----
CREATE POLICY "Members see own balance" ON leave_balances FOR SELECT TO authenticated USING (user_id = get_my_team_member_id() OR is_admin());

-- ---- announcements ----
CREATE POLICY "All authenticated can read announcements" ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can post announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Only admins can delete announcements" ON announcements FOR DELETE TO authenticated USING (is_admin());

-- ---- reactions ----
CREATE POLICY "All authenticated can read reactions" ON announcement_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can add own reactions" ON announcement_reactions FOR INSERT TO authenticated WITH CHECK (user_id = get_my_team_member_id());
CREATE POLICY "Authenticated can delete own reactions" ON announcement_reactions FOR DELETE TO authenticated USING (user_id = get_my_team_member_id());

-- ---- replies ----
CREATE POLICY "All authenticated can read replies" ON announcement_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can add replies" ON announcement_replies FOR INSERT TO authenticated WITH CHECK (author_id = get_my_team_member_id());

-- ---- audit_log ----
CREATE POLICY "Admins can view audit log" ON audit_log FOR SELECT TO authenticated USING (is_admin());
-- No UPDATE/DELETE policies = immutable

-- ================================================================
-- SEED DATA — National Holidays 2025-2026 (India)
-- ================================================================
INSERT INTO national_holidays (date, name, year) VALUES
  ('2025-01-26', 'Republic Day', 2025),
  ('2025-03-14', 'Holi', 2025),
  ('2025-04-14', 'Dr. Ambedkar Jayanti', 2025),
  ('2025-04-18', 'Good Friday', 2025),
  ('2025-05-01', 'Labour Day', 2025),
  ('2025-08-15', 'Independence Day', 2025),
  ('2025-10-02', 'Gandhi Jayanti', 2025),
  ('2025-10-20', 'Dussehra', 2025),
  ('2025-11-05', 'Diwali', 2025),
  ('2025-11-15', 'Guru Nanak Jayanti', 2025),
  ('2025-12-25', 'Christmas Day', 2025),
  ('2026-01-26', 'Republic Day', 2026),
  ('2026-08-15', 'Independence Day', 2026),
  ('2026-10-02', 'Gandhi Jayanti', 2026),
  ('2026-12-25', 'Christmas Day', 2026)
ON CONFLICT (date) DO NOTHING;

-- ================================================================
-- SUPABASE STORAGE BUCKETS (run via Supabase dashboard or API)
-- ================================================================
-- Create a public bucket called 'media' for announcement attachments
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
