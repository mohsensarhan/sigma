-- ============================================================================
-- TruPath V2 Production Schema
-- Creates all tables needed for production (except SMS/Payment APIs)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. JOURNEYS TABLE
-- Tracks donation journeys from HQ to beneficiary
-- ============================================================================
CREATE TABLE IF NOT EXISTS journeys (
  id TEXT PRIMARY KEY,
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('general', 'location-fixed', 'program-fixed')),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'failed')) DEFAULT 'active',
  current_stage INTEGER NOT NULL CHECK (current_stage >= 1 AND current_stage <= 5) DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Beneficiary details
  governorate_id TEXT,
  program_id TEXT,
  family_id TEXT,

  -- Donor details (denormalized for performance)
  donor_name TEXT,
  donor_phone TEXT,
  donor_email TEXT,
  amount NUMERIC(10, 2),

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_journeys_donor_id ON journeys(donor_id);
CREATE INDEX IF NOT EXISTS idx_journeys_status ON journeys(status);
CREATE INDEX IF NOT EXISTS idx_journeys_created_at ON journeys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journeys_donor_phone ON journeys(donor_phone);

-- ============================================================================
-- 2. JOURNEY EVENTS TABLE
-- Tracks individual waypoint status (5 stages per journey)
-- ============================================================================
CREATE TABLE IF NOT EXISTS journey_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL CHECK (stage >= 1 AND stage <= 5),
  stage_name TEXT NOT NULL,
  location TEXT NOT NULL,
  lon NUMERIC(10, 6) NOT NULL,
  lat NUMERIC(10, 6) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed')) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Waypoint details
  metadata JSONB, -- Package details, handler info, temperature, etc.

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journey_events_journey_id ON journey_events(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_stage ON journey_events(stage);
CREATE INDEX IF NOT EXISTS idx_journey_events_status ON journey_events(status);

-- Unique constraint: one event per stage per journey
CREATE UNIQUE INDEX IF NOT EXISTS idx_journey_events_unique ON journey_events(journey_id, stage);

-- ============================================================================
-- 3. DONATIONS TABLE
-- Tracks payment transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id TEXT REFERENCES journeys(id) ON DELETE SET NULL,
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Payment details
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT, -- 'stripe', 'paymob', 'cash', etc.
  payment_intent_id TEXT, -- Stripe PaymentIntent ID or equivalent
  transaction_id TEXT, -- External payment gateway transaction ID

  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',

  -- Error handling
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_donations_journey_id ON donations(journey_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_payment_intent_id ON donations(payment_intent_id);

-- ============================================================================
-- 4. SMS LOGS TABLE
-- Tracks all SMS notifications sent to donors
-- ============================================================================
CREATE TABLE IF NOT EXISTS sms_logs (
  id TEXT PRIMARY KEY,
  journey_id TEXT REFERENCES journeys(id) ON DELETE SET NULL,

  -- SMS details
  to_phone TEXT NOT NULL,
  from_phone TEXT,
  body TEXT NOT NULL,

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed')) DEFAULT 'queued',
  provider_id TEXT, -- Twilio SID, AWS SNS MessageId, etc.
  provider TEXT, -- 'twilio', 'aws_sns', 'mock'

  -- Journey context
  stage INTEGER CHECK (stage >= 1 AND stage <= 5),

  -- Error handling
  error_message TEXT,
  error_code TEXT,

  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_logs_journey_id ON sms_logs(journey_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_to_phone ON sms_logs(to_phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);

-- ============================================================================
-- 5. DONOR PROFILES TABLE
-- Extends auth.users with donation-specific data
-- ============================================================================
CREATE TABLE IF NOT EXISTS donor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contact info
  phone TEXT,
  name TEXT,

  -- Statistics
  total_donations_amount NUMERIC(12, 2) DEFAULT 0,
  total_donations_count INTEGER DEFAULT 0,
  total_meals_provided INTEGER DEFAULT 0,

  -- Preferences
  preferred_programs TEXT[], -- Array of program IDs
  preferred_governorates TEXT[], -- Array of governorate IDs
  notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": false}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_donor_profiles_phone ON donor_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_total_donations ON donor_profiles(total_donations_amount DESC);

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- Donors can only see their own data
-- ============================================================================

ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Journeys: Donors can view their own journeys
CREATE POLICY "Donors can view their own journeys"
  ON journeys FOR SELECT
  USING (auth.uid() = donor_id OR donor_id IS NULL);

CREATE POLICY "Service role can manage all journeys"
  ON journeys FOR ALL
  USING (auth.role() = 'service_role');

-- Journey Events: Donors can view events for their journeys
CREATE POLICY "Donors can view their journey events"
  ON journey_events FOR SELECT
  USING (journey_id IN (SELECT id FROM journeys WHERE donor_id = auth.uid()));

CREATE POLICY "Service role can manage all journey events"
  ON journey_events FOR ALL
  USING (auth.role() = 'service_role');

-- Donations: Donors can view their own donations
CREATE POLICY "Donors can view their own donations"
  ON donations FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Service role can manage all donations"
  ON donations FOR ALL
  USING (auth.role() = 'service_role');

-- Donor Profiles: Users can manage their own profile
CREATE POLICY "Users can view and edit their own profile"
  ON donor_profiles FOR ALL
  USING (auth.uid() = id);

-- SMS Logs: Only service role can access (contains sensitive phone numbers)
CREATE POLICY "Service role can manage SMS logs"
  ON sms_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_journeys_updated_at
  BEFORE UPDATE ON journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donor_profiles_updated_at
  BEFORE UPDATE ON donor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to get journey progress percentage
CREATE OR REPLACE FUNCTION get_journey_progress(p_journey_id TEXT)
RETURNS NUMERIC AS $$
DECLARE
  completed_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO completed_count
  FROM journey_events
  WHERE journey_id = p_journey_id AND status = 'completed';

  SELECT COUNT(*) INTO total_count
  FROM journey_events
  WHERE journey_id = p_journey_id;

  IF total_count = 0 THEN
    RETURN 0;
  END IF;

  RETURN (completed_count::NUMERIC / total_count::NUMERIC) * 100;
END;
$$ LANGUAGE plpgsql;

-- Function to update donor statistics
CREATE OR REPLACE FUNCTION update_donor_stats(p_donor_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_amount NUMERIC;
  v_total_count INTEGER;
BEGIN
  -- Calculate totals from donations
  SELECT
    COALESCE(SUM(amount), 0),
    COALESCE(COUNT(*), 0)
  INTO v_total_amount, v_total_count
  FROM donations
  WHERE donor_id = p_donor_id AND status = 'completed';

  -- Update donor profile
  INSERT INTO donor_profiles (id, total_donations_amount, total_donations_count)
  VALUES (p_donor_id, v_total_amount, v_total_count)
  ON CONFLICT (id) DO UPDATE
  SET
    total_donations_amount = v_total_amount,
    total_donations_count = v_total_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update donor stats when donation completes
CREATE OR REPLACE FUNCTION trigger_update_donor_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF NEW.donor_id IS NOT NULL THEN
      PERFORM update_donor_stats(NEW.donor_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_donor_stats_on_donation
  AFTER INSERT OR UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_donor_stats();

-- ============================================================================
-- 9. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active journeys with latest event
CREATE OR REPLACE VIEW active_journeys_summary AS
SELECT
  j.id,
  j.donor_name,
  j.donor_phone,
  j.amount,
  j.current_stage,
  j.started_at,
  j.governorate_id,
  j.program_id,
  (SELECT stage_name FROM journey_events WHERE journey_id = j.id AND status = 'active' LIMIT 1) as current_location,
  get_journey_progress(j.id) as progress_percentage
FROM journeys j
WHERE j.status = 'active'
ORDER BY j.started_at DESC;

-- View: Donation statistics by donor
CREATE OR REPLACE VIEW donor_donation_stats AS
SELECT
  dp.id,
  dp.name,
  dp.phone,
  dp.total_donations_amount,
  dp.total_donations_count,
  COALESCE(dp.total_donations_amount / NULLIF(dp.total_donations_count, 0), 0) as average_donation,
  (SELECT COUNT(*) FROM journeys WHERE donor_id = dp.id AND status = 'completed') as completed_journeys,
  (SELECT COUNT(*) FROM journeys WHERE donor_id = dp.id AND status = 'active') as active_journeys
FROM donor_profiles dp
ORDER BY dp.total_donations_amount DESC;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration success
DO $$
BEGIN
  RAISE NOTICE 'TruPath V2 Production Schema Created Successfully';
  RAISE NOTICE 'Tables: journeys, journey_events, donations, sms_logs, donor_profiles';
  RAISE NOTICE 'RLS Policies: Enabled for all tables';
  RAISE NOTICE 'Ready for API Integration';
END $$;
