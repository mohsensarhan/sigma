-- ============================================================================
-- TruPath V2 - Reference Data Migration
-- Creates tables for governorates, villages, programs, families
-- With proper foreign key relationships
-- ============================================================================

-- ============================================================================
-- 1. GOVERNORATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS governorates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
  strategic_warehouse JSONB NOT NULL, -- {name, lon, lat}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_governorates_name ON governorates(name);
CREATE INDEX IF NOT EXISTS idx_governorates_weight ON governorates(weight DESC);

COMMENT ON TABLE governorates IS 'Egyptian governorates where EFB operates';
COMMENT ON COLUMN governorates.weight IS 'Weight for weighted random selection (higher = more likely)';
COMMENT ON COLUMN governorates.strategic_warehouse IS 'Regional warehouse location {name, lon, lat}';

-- ============================================================================
-- 2. PROGRAMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_name ON programs(name);
CREATE INDEX IF NOT EXISTS idx_programs_weight ON programs(weight DESC);

COMMENT ON TABLE programs IS 'EFB assistance programs (Ramadan, School Meals, etc.)';
COMMENT ON COLUMN programs.weight IS 'Weight for weighted random selection';

-- ============================================================================
-- 3. VILLAGES TABLE
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_villages_governorate_id ON villages(governorate_id);
CREATE INDEX IF NOT EXISTS idx_villages_name ON villages(name);
CREATE INDEX IF NOT EXISTS idx_villages_location ON villages(lon, lat);

COMMENT ON TABLE villages IS 'Villages within governorates where families reside';
COMMENT ON COLUMN villages.governorate_id IS 'FK to governorates table';

-- ============================================================================
-- 4. FAMILIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  village_id TEXT NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  profile TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_families_program_id ON families(program_id);
CREATE INDEX IF NOT EXISTS idx_families_village_id ON families(village_id);
CREATE INDEX IF NOT EXISTS idx_families_active ON families(active);
CREATE INDEX IF NOT EXISTS idx_families_program_village ON families(program_id, village_id);

COMMENT ON TABLE families IS 'Beneficiary families enrolled in programs';
COMMENT ON COLUMN families.profile IS 'Description of family situation (e.g., "3 children, single mother")';
COMMENT ON COLUMN families.active IS 'Whether family is still enrolled in the program';

-- ============================================================================
-- 5. ADD FOREIGN KEYS TO EXISTING JOURNEYS TABLE
-- ============================================================================

-- Add foreign key constraints to journeys table
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

-- ============================================================================
-- 6. TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

CREATE TRIGGER update_governorates_updated_at
  BEFORE UPDATE ON governorates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_villages_updated_at
  BEFORE UPDATE ON villages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on reference data tables
ALTER TABLE governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Public read access for reference data (everyone can see available options)
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
  USING (active = true); -- Only show active families

-- Service role can manage all reference data
CREATE POLICY "Service role can manage governorates"
  ON governorates FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage programs"
  ON programs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage villages"
  ON villages FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage families"
  ON families FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 8. HELPER VIEWS
-- ============================================================================

-- View: Families with full geographic context
CREATE OR REPLACE VIEW families_with_location AS
SELECT 
  f.id,
  f.program_id,
  p.name as program_name,
  f.village_id,
  v.name as village_name,
  v.lon,
  v.lat,
  v.governorate_id,
  g.name as governorate_name,
  g.strategic_warehouse,
  f.profile,
  f.active
FROM families f
JOIN villages v ON f.village_id = v.id
JOIN governorates g ON v.governorate_id = g.id
JOIN programs p ON f.program_id = p.id;

-- View: Program distribution by governorate
CREATE OR REPLACE VIEW program_distribution AS
SELECT 
  g.id as governorate_id,
  g.name as governorate_name,
  p.id as program_id,
  p.name as program_name,
  COUNT(f.id) as family_count
FROM governorates g
CROSS JOIN programs p
LEFT JOIN villages v ON v.governorate_id = g.id
LEFT JOIN families f ON f.village_id = v.id AND f.program_id = p.id AND f.active = true
GROUP BY g.id, g.name, p.id, p.name
ORDER BY g.name, p.name;

-- View: Governorate statistics
CREATE OR REPLACE VIEW governorate_stats AS
SELECT 
  g.id,
  g.name,
  g.weight,
  COUNT(DISTINCT v.id) as village_count,
  COUNT(DISTINCT f.id) as family_count,
  COUNT(DISTINCT f.program_id) as program_count
FROM governorates g
LEFT JOIN villages v ON v.governorate_id = g.id
LEFT JOIN families f ON f.village_id = v.id AND f.active = true
GROUP BY g.id, g.name, g.weight
ORDER BY g.name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Reference Data Tables Created Successfully';
  RAISE NOTICE 'Tables: governorates, programs, villages, families';
  RAISE NOTICE 'Foreign Keys: Added to journeys table';
  RAISE NOTICE 'RLS Policies: Public read, service role write';
  RAISE NOTICE 'Ready for data seeding';
END $$;