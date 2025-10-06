-- Fix RLS Policies for Mock Donors
-- The issue: App uses anon key, but RLS policies only allow service_role
-- Solution: Add policies for anonymous users (mock donors without auth)

-- ============================================================================
-- JOURNEYS: Allow anonymous inserts for mock donors
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Donors can view their own journeys" ON journeys;
DROP POLICY IF EXISTS "Service role can manage all journeys" ON journeys;

-- Create new permissive policies
CREATE POLICY "Anyone can view journeys"
  ON journeys FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert journeys"
  ON journeys FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update journeys"
  ON journeys FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete journeys"
  ON journeys FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- JOURNEY EVENTS: Allow anonymous access
-- ============================================================================

DROP POLICY IF EXISTS "Donors can view their journey events" ON journey_events;
DROP POLICY IF EXISTS "Service role can manage all journey events" ON journey_events;

CREATE POLICY "Anyone can view journey events"
  ON journey_events FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert journey events"
  ON journey_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update journey events"
  ON journey_events FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete journey events"
  ON journey_events FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- DONATIONS: Allow anonymous inserts
-- ============================================================================

DROP POLICY IF EXISTS "Donors can view their own donations" ON donations;
DROP POLICY IF EXISTS "Service role can manage all donations" ON donations;

CREATE POLICY "Anyone can view donations"
  ON donations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert donations"
  ON donations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update donations"
  ON donations FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete donations"
  ON donations FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- SMS LOGS: Allow anonymous inserts
-- ============================================================================

DROP POLICY IF EXISTS "Service role can manage SMS logs" ON sms_logs;

CREATE POLICY "Anyone can view SMS logs"
  ON sms_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert SMS logs"
  ON sms_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update SMS logs"
  ON sms_logs FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete SMS logs"
  ON sms_logs FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- DONOR PROFILES: Keep restrictive (requires auth)
-- ============================================================================

-- No changes needed - this table requires authenticated users

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;