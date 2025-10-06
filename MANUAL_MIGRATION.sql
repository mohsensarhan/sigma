-- ============================================================================
-- COPY THIS ENTIRE FILE AND PASTE INTO SUPABASE SQL EDITOR
-- Then click "Run" to execute
-- ============================================================================

-- Step 1: Create Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS governorates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
  strategic_warehouse JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add description column to programs if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'programs' AND column_name = 'description'
  ) THEN
    ALTER TABLE programs ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column to programs table';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS villages (
  id TEXT PRIMARY KEY,
  governorate_id TEXT NOT NULL REFERENCES governorates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lon NUMERIC(10, 6) NOT NULL,
  lat NUMERIC(10, 6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(governorate_id, name)
);

CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  village_id TEXT NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  profile TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert Reference Data (BEFORE adding foreign keys)
-- ============================================================================

INSERT INTO governorates (id, name, weight, strategic_warehouse) VALUES
  ('minya', 'Minya', 100, '{"name": "Minya Strategic Reserve", "lon": 30.7503, "lat": 28.1099}'::jsonb),
  ('aswan', 'Aswan', 90, '{"name": "Aswan Strategic Reserve", "lon": 32.8998, "lat": 24.0889}'::jsonb),
  ('luxor', 'Luxor', 95, '{"name": "Luxor Strategic Reserve", "lon": 32.6396, "lat": 25.6872}'::jsonb),
  ('sohag', 'Sohag', 85, '{"name": "Sohag Strategic Reserve", "lon": 31.6948, "lat": 26.5569}'::jsonb),
  ('qena', 'Qena', 80, '{"name": "Qena Strategic Reserve", "lon": 32.7167, "lat": 26.1551}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  weight = EXCLUDED.weight,
  strategic_warehouse = EXCLUDED.strategic_warehouse;

INSERT INTO programs (id, name, weight, description) VALUES
  ('ramadan', 'Ramadan Food Parcels', 100, 'Emergency food packages distributed during Ramadan'),
  ('school', 'School Meal Program', 90, 'Daily meals for school-age children'),
  ('winter', 'Winter Relief Packages', 85, 'Warm clothing and food for winter months'),
  ('emergency', 'Emergency Food Aid', 95, 'Urgent assistance for crisis situations'),
  ('nutrition', 'Child Nutrition Support', 80, 'Specialized nutrition for infants and young children'),
  ('elderly', 'Elderly Care Packages', 75, 'Assistance for elderly individuals and couples')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  weight = EXCLUDED.weight,
  description = EXCLUDED.description;

INSERT INTO villages (id, governorate_id, name, lon, lat) VALUES
  ('v_minya_1', 'minya', 'Idamo', 30.7234, 28.0567),
  ('v_minya_2', 'minya', 'Samalut', 30.7092, 28.3089),
  ('v_minya_3', 'minya', 'Beni Mazar', 30.7986, 28.4944),
  ('v_aswan_1', 'aswan', 'Kom Ombo', 32.9318, 24.4764),
  ('v_aswan_2', 'aswan', 'Edfu', 32.8742, 24.9781),
  ('v_aswan_3', 'aswan', 'Daraw', 32.9156, 24.3547),
  ('v_luxor_1', 'luxor', 'Armant', 32.5331, 25.6167),
  ('v_luxor_2', 'luxor', 'Esna', 32.5533, 25.2933),
  ('v_sohag_1', 'sohag', 'Akhmim', 31.7472, 26.5667),
  ('v_sohag_2', 'sohag', 'Girga', 31.8917, 26.3406),
  ('v_sohag_3', 'sohag', 'El Balyana', 32.0047, 26.2358),
  ('v_qena_1', 'qena', 'Nag Hammadi', 32.2397, 26.0489),
  ('v_qena_2', 'qena', 'Qus', 32.7597, 25.9147)
ON CONFLICT (id) DO UPDATE SET
  governorate_id = EXCLUDED.governorate_id,
  name = EXCLUDED.name,
  lon = EXCLUDED.lon,
  lat = EXCLUDED.lat;

INSERT INTO families (id, program_id, village_id, profile) VALUES
  ('f_001', 'ramadan', 'v_minya_1', '3 children, single mother, disabled woman 55'),
  ('f_002', 'school', 'v_minya_1', '4 children, elderly grandmother 68'),
  ('f_003', 'winter', 'v_minya_1', '2 children, single father, widow 42'),
  ('f_004', 'emergency', 'v_minya_1', '5 children, unemployed father, sick mother'),
  ('f_005', 'nutrition', 'v_minya_1', '1 infant, 2 toddlers, single mother 29'),
  ('f_006', 'elderly', 'v_minya_1', 'elderly couple 72, no income'),
  ('f_007', 'ramadan', 'v_minya_2', '6 children, disabled father 48'),
  ('f_008', 'school', 'v_minya_2', '3 school-age children, widow 39'),
  ('f_009', 'winter', 'v_minya_2', '2 children, elderly parents 65'),
  ('f_010', 'emergency', 'v_minya_2', '4 children, recently displaced family'),
  ('f_011', 'nutrition', 'v_minya_2', 'twins under 2, malnourished mother 26'),
  ('f_012', 'ramadan', 'v_minya_3', '4 children, chronically ill father 51'),
  ('f_013', 'school', 'v_minya_3', '5 school children, single mother 44'),
  ('f_014', 'elderly', 'v_minya_3', 'disabled elderly woman 81, lives alone'),
  ('f_015', 'ramadan', 'v_aswan_1', '3 children, widow 37'),
  ('f_016', 'school', 'v_aswan_1', '2 children, disabled mother 33'),
  ('f_017', 'winter', 'v_aswan_1', '4 children, seasonal worker father'),
  ('f_018', 'emergency', 'v_aswan_1', '3 children, fire victim family'),
  ('f_019', 'nutrition', 'v_aswan_1', '1 newborn, 3 under-5 children'),
  ('f_020', 'ramadan', 'v_aswan_2', '5 children, unemployed parents'),
  ('f_021', 'school', 'v_aswan_2', '4 school-age, single father 46'),
  ('f_022', 'winter', 'v_aswan_2', '2 children, elderly caretaker 70'),
  ('f_023', 'elderly', 'v_aswan_2', 'elderly man 78, diabetic'),
  ('f_024', 'ramadan', 'v_aswan_3', '7 children, large family in poverty'),
  ('f_025', 'emergency', 'v_aswan_3', '3 children, flood-affected family'),
  ('f_026', 'nutrition', 'v_aswan_3', '2 malnourished children, sick mother 31'),
  ('f_027', 'ramadan', 'v_luxor_1', '4 children, widow 41'),
  ('f_028', 'school', 'v_luxor_1', '3 children, disabled father 52'),
  ('f_029', 'winter', 'v_luxor_1', '2 children, elderly grandmother caring'),
  ('f_030', 'emergency', 'v_luxor_1', '5 children, medical crisis family'),
  ('f_031', 'nutrition', 'v_luxor_1', '1 infant, 1 toddler, young mother 23'),
  ('f_032', 'ramadan', 'v_luxor_2', '6 children, unemployed father 49'),
  ('f_033', 'school', 'v_luxor_2', '4 students, single mother 38'),
  ('f_034', 'elderly', 'v_luxor_2', 'elderly couple 75, both ill'),
  ('f_035', 'ramadan', 'v_sohag_1', '3 children, disabled woman 43'),
  ('f_036', 'school', 'v_sohag_1', '5 school children, widow 47'),
  ('f_037', 'winter', 'v_sohag_1', '2 children, chronically ill mother 36'),
  ('f_038', 'emergency', 'v_sohag_1', '4 children, evicted family'),
  ('f_039', 'nutrition', 'v_sohag_1', 'triplets under 1, struggling mother 28'),
  ('f_040', 'ramadan', 'v_sohag_2', '4 children, single father 44'),
  ('f_041', 'school', 'v_sohag_2', '3 children, elderly parents 68'),
  ('f_042', 'winter', 'v_sohag_2', '5 children, poor housing family'),
  ('f_043', 'elderly', 'v_sohag_2', 'disabled elderly man 82'),
  ('f_044', 'ramadan', 'v_sohag_3', '2 children, widow 34'),
  ('f_045', 'emergency', 'v_sohag_3', '3 children, accident victim father'),
  ('f_046', 'nutrition', 'v_sohag_3', '2 undernourished children, sick mother 32'),
  ('f_047', 'ramadan', 'v_qena_1', '5 children, unemployed father 50'),
  ('f_048', 'school', 'v_qena_1', '4 school-age, disabled mother 40'),
  ('f_049', 'winter', 'v_qena_1', '3 children, elderly caretaker 73'),
  ('f_050', 'emergency', 'v_qena_1', '2 children, house collapse victims'),
  ('f_051', 'nutrition', 'v_qena_1', '1 infant, 2 toddlers, young mother 24'),
  ('f_052', 'ramadan', 'v_qena_2', '6 children, large poor family'),
  ('f_053', 'school', 'v_qena_2', '3 students, single father 48'),
  ('f_054', 'winter', 'v_qena_2', '4 children, seasonal income family'),
  ('f_055', 'elderly', 'v_qena_2', 'elderly woman 79, no family support')
ON CONFLICT (id) DO UPDATE SET
  program_id = EXCLUDED.program_id,
  village_id = EXCLUDED.village_id,
  profile = EXCLUDED.profile;

-- Step 3: Update Existing Journey Data (if journeys table exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journeys') THEN
    -- Map governorate names to IDs
    UPDATE journeys SET governorate_id = LOWER(governorate_id) WHERE governorate_id IS NOT NULL;
    
    -- Map program full names to IDs
    UPDATE journeys SET program_id = 'ramadan' WHERE LOWER(program_id) LIKE '%ramadan%';
    UPDATE journeys SET program_id = 'school' WHERE LOWER(program_id) LIKE '%school%';
    UPDATE journeys SET program_id = 'winter' WHERE LOWER(program_id) LIKE '%winter%';
    UPDATE journeys SET program_id = 'emergency' WHERE LOWER(program_id) LIKE '%emergency%';
    UPDATE journeys SET program_id = 'nutrition' WHERE LOWER(program_id) LIKE '%nutrition%';
    UPDATE journeys SET program_id = 'elderly' WHERE LOWER(program_id) LIKE '%elderly%';
    
    RAISE NOTICE 'Updated existing journey data to match reference IDs';
  END IF;
END $$;

-- Step 4: Add Foreign Keys to Journeys (NOW that data matches)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journeys') THEN
    ALTER TABLE journeys DROP CONSTRAINT IF EXISTS fk_journeys_governorate;
    ALTER TABLE journeys DROP CONSTRAINT IF EXISTS fk_journeys_program;
    ALTER TABLE journeys DROP CONSTRAINT IF EXISTS fk_journeys_family;
    
    ALTER TABLE journeys 
      ADD CONSTRAINT fk_journeys_governorate 
      FOREIGN KEY (governorate_id) 
      REFERENCES governorates(id) 
      ON DELETE SET NULL;

    ALTER TABLE journeys 
      ADD CONSTRAINT fk_journeys_program 
      FOREIGN KEY (program_id) 
      REFERENCES programs(id) 
      ON DELETE SET NULL;

    ALTER TABLE journeys 
      ADD CONSTRAINT fk_journeys_family 
      FOREIGN KEY (family_id) 
      REFERENCES families(id) 
      ON DELETE SET NULL;
      
    RAISE NOTICE 'Added foreign key constraints to journeys table';
  END IF;
END $$;

-- Step 5: Enable RLS and Create Policies
-- ============================================================================

ALTER TABLE governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for governorates" ON governorates;
DROP POLICY IF EXISTS "Public read access for programs" ON programs;
DROP POLICY IF EXISTS "Public read access for villages" ON villages;
DROP POLICY IF EXISTS "Public read access for families" ON families;

-- Create new policies
CREATE POLICY "Public read access for governorates"
  ON governorates FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Public read access for programs"
  ON programs FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Public read access for villages"
  ON villages FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Public read access for families"
  ON families FOR SELECT
  TO authenticated, anon
  USING (true);

-- Step 6: Verification
-- ============================================================================

DO $$
DECLARE
  gov_count INTEGER;
  prog_count INTEGER;
  vill_count INTEGER;
  fam_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO gov_count FROM governorates;
  SELECT COUNT(*) INTO prog_count FROM programs;
  SELECT COUNT(*) INTO vill_count FROM villages;
  SELECT COUNT(*) INTO fam_count FROM families;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Governorates: %', gov_count;
  RAISE NOTICE 'Programs: %', prog_count;
  RAISE NOTICE 'Villages: %', vill_count;
  RAISE NOTICE 'Families: %', fam_count;
  RAISE NOTICE '========================================';
END $$;