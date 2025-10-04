-- ============================================================================
-- TruPath V1 - Database Schema for Authentication & Donor Profiles
-- Run this FIRST in Supabase SQL Editor before running seed data
-- ============================================================================

-- Step 1: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create donor_profiles table
CREATE TABLE IF NOT EXISTS donor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  name TEXT,
  total_donations_amount DECIMAL(10,2) DEFAULT 0,
  total_donations_count INTEGER DEFAULT 0,
  total_meals_provided INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable Row Level Security
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies for donor_profiles
-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON donor_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for new signups)
CREATE POLICY "Users can insert own profile" 
ON donor_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON donor_profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Policy: Users cannot delete their own profile (data integrity)
-- No delete policy - profiles are permanent for audit trail

-- Step 5: Create function to automatically create donor profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.donor_profiles (id, email, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger to automatically create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger to auto-update updated_at
CREATE OR REPLACE TRIGGER update_donor_profile_updated_at
  BEFORE UPDATE ON public.donor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 9: Create function to calculate donor impact metrics
CREATE OR REPLACE FUNCTION public.calculate_donor_impact(donor_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_amount', COALESCE(dp.total_donations_amount, 0),
    'total_count', COALESCE(dp.total_donations_count, 0),
    'meals_provided', COALESCE(dp.total_meals_provided, 0),
    'families_helped', COALESCE(dp.total_donations_count, 0), -- Assuming 1 family per donation
    'last_donation_date', (
      SELECT MAX(created_at) 
      FROM donations 
      WHERE donor_id = donor_uuid AND status = 'completed'
    )
  ) INTO result
  FROM donor_profiles dp
  WHERE dp.id = donor_uuid;

  RETURN COALESCE(result, jsonb_build_object(
    'total_amount', 0,
    'total_count', 0,
    'meals_provided', 0,
    'families_helped', 0,
    'last_donation_date', NULL
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Grant necessary permissions
-- Allow authenticated users to use the calculate_donor_impact function
GRANT EXECUTE ON FUNCTION public.calculate_donor_impact(UUID) TO authenticated;

-- Step 11: Create view for donor statistics (for admin dashboard)
CREATE OR REPLACE VIEW public.donor_statistics AS
SELECT 
  dp.id,
  dp.email,
  dp.name,
  dp.total_donations_amount,
  dp.total_donations_count,
  dp.total_meals_provided,
  dp.created_at,
  dp.updated_at,
  -- Calculate days since last donation
  CASE 
    WHEN d.last_donation IS NOT NULL 
    THEN EXTRACT(DAYS FROM NOW() - d.last_donation)
    ELSE NULL 
  END as days_since_last_donation
FROM donor_profiles dp
LEFT JOIN (
  SELECT 
    donor_id, 
    MAX(created_at) as last_donation
  FROM donations 
  WHERE status = 'completed'
  GROUP BY donor_id
) d ON dp.id = d.donor_id;

-- Step 12: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_donor_profiles_email ON donor_profiles(email);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_created_at ON donor_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_total_amount ON donor_profiles(total_donations_amount DESC);

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to confirm schema was created correctly
-- ============================================================================

-- Should return 1 (donor_profiles table exists)
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'donor_profiles';

-- Should return 4 (RLS policies created)
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'donor_profiles';

-- Should return 2 (triggers created)
SELECT COUNT(*) as trigger_count 
FROM information_schema.triggers 
WHERE event_object_table = 'donor_profiles' 
   OR event_object_table = 'users';

-- Should return 1 (function created)
SELECT COUNT(*) as function_count 
FROM information_schema.routines 
WHERE routine_name = 'calculate_donor_impact' 
   AND routine_schema = 'public';

-- Show all donor-related objects
SELECT 'donor_profiles table' as object_name, 'table' as object_type
UNION ALL
SELECT 'handle_new_user function', 'function'
UNION ALL
SELECT 'calculate_donor_impact function', 'function'
UNION ALL
SELECT 'on_auth_user_created trigger', 'trigger'
UNION ALL
SELECT 'update_donor_profile_updated_at trigger', 'trigger'
UNION ALL
SELECT 'donor_statistics view', 'view';
