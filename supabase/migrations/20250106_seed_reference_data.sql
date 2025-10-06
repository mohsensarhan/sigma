-- ============================================================================
-- TruPath V2 - Reference Data Seeding
-- Populates governorates, programs, villages, and families tables
-- ============================================================================

-- ============================================================================
-- 1. SEED GOVERNORATES (5 regions)
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
  strategic_warehouse = EXCLUDED.strategic_warehouse,
  updated_at = NOW();

-- ============================================================================
-- 2. SEED PROGRAMS (6 EFB programs)
-- ============================================================================
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
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- 3. SEED VILLAGES (14 villages across 5 governorates)
-- ============================================================================
INSERT INTO villages (id, governorate_id, name, lon, lat) VALUES
  -- Minya villages (3)
  ('v_minya_1', 'minya', 'Idamo', 30.7234, 28.0567),
  ('v_minya_2', 'minya', 'Samalut', 30.7092, 28.3089),
  ('v_minya_3', 'minya', 'Beni Mazar', 30.7986, 28.4944),
  
  -- Aswan villages (3)
  ('v_aswan_1', 'aswan', 'Kom Ombo', 32.9318, 24.4764),
  ('v_aswan_2', 'aswan', 'Edfu', 32.8742, 24.9781),
  ('v_aswan_3', 'aswan', 'Daraw', 32.9156, 24.3547),
  
  -- Luxor villages (2)
  ('v_luxor_1', 'luxor', 'Armant', 32.5331, 25.6167),
  ('v_luxor_2', 'luxor', 'Esna', 32.5533, 25.2933),
  
  -- Sohag villages (3)
  ('v_sohag_1', 'sohag', 'Akhmim', 31.7472, 26.5667),
  ('v_sohag_2', 'sohag', 'Girga', 31.8917, 26.3406),
  ('v_sohag_3', 'sohag', 'El Balyana', 32.0047, 26.2358),
  
  -- Qena villages (2)
  ('v_qena_1', 'qena', 'Nag Hammadi', 32.2397, 26.0489),
  ('v_qena_2', 'qena', 'Qus', 32.7597, 25.9147)
ON CONFLICT (id) DO UPDATE SET
  governorate_id = EXCLUDED.governorate_id,
  name = EXCLUDED.name,
  lon = EXCLUDED.lon,
  lat = EXCLUDED.lat,
  updated_at = NOW();

-- ============================================================================
-- 4. SEED FAMILIES (55 families across programs and villages)
-- ============================================================================
INSERT INTO families (id, program_id, village_id, profile, active) VALUES
  -- Minya - Idamo (6 families)
  ('f_001', 'ramadan', 'v_minya_1', '3 children, single mother, disabled woman 55', true),
  ('f_002', 'school', 'v_minya_1', '4 children, elderly grandmother 68', true),
  ('f_003', 'winter', 'v_minya_1', '2 children, single father, widow 42', true),
  ('f_004', 'emergency', 'v_minya_1', '5 children, unemployed father, sick mother', true),
  ('f_005', 'nutrition', 'v_minya_1', '1 infant, 2 toddlers, single mother 29', true),
  ('f_006', 'elderly', 'v_minya_1', 'elderly couple 72, no income', true),

  -- Minya - Samalut (5 families)
  ('f_007', 'ramadan', 'v_minya_2', '6 children, disabled father 48', true),
  ('f_008', 'school', 'v_minya_2', '3 school-age children, widow 39', true),
  ('f_009', 'winter', 'v_minya_2', '2 children, elderly parents 65', true),
  ('f_010', 'emergency', 'v_minya_2', '4 children, recently displaced family', true),
  ('f_011', 'nutrition', 'v_minya_2', 'twins under 2, malnourished mother 26', true),

  -- Minya - Beni Mazar (3 families)
  ('f_012', 'ramadan', 'v_minya_3', '4 children, chronically ill father 51', true),
  ('f_013', 'school', 'v_minya_3', '5 school children, single mother 44', true),
  ('f_014', 'elderly', 'v_minya_3', 'disabled elderly woman 81, lives alone', true),

  -- Aswan - Kom Ombo (5 families)
  ('f_015', 'ramadan', 'v_aswan_1', '3 children, widow 37', true),
  ('f_016', 'school', 'v_aswan_1', '2 children, disabled mother 33', true),
  ('f_017', 'winter', 'v_aswan_1', '4 children, seasonal worker father', true),
  ('f_018', 'emergency', 'v_aswan_1', '3 children, fire victim family', true),
  ('f_019', 'nutrition', 'v_aswan_1', '1 newborn, 3 under-5 children', true),

  -- Aswan - Edfu (4 families)
  ('f_020', 'ramadan', 'v_aswan_2', '5 children, unemployed parents', true),
  ('f_021', 'school', 'v_aswan_2', '4 school-age, single father 46', true),
  ('f_022', 'winter', 'v_aswan_2', '2 children, elderly caretaker 70', true),
  ('f_023', 'elderly', 'v_aswan_2', 'elderly man 78, diabetic', true),

  -- Aswan - Daraw (3 families)
  ('f_024', 'ramadan', 'v_aswan_3', '7 children, large family in poverty', true),
  ('f_025', 'emergency', 'v_aswan_3', '3 children, flood-affected family', true),
  ('f_026', 'nutrition', 'v_aswan_3', '2 malnourished children, sick mother 31', true),

  -- Luxor - Armant (5 families)
  ('f_027', 'ramadan', 'v_luxor_1', '4 children, widow 41', true),
  ('f_028', 'school', 'v_luxor_1', '3 children, disabled father 52', true),
  ('f_029', 'winter', 'v_luxor_1', '2 children, elderly grandmother caring', true),
  ('f_030', 'emergency', 'v_luxor_1', '5 children, medical crisis family', true),
  ('f_031', 'nutrition', 'v_luxor_1', '1 infant, 1 toddler, young mother 23', true),

  -- Luxor - Esna (3 families)
  ('f_032', 'ramadan', 'v_luxor_2', '6 children, unemployed father 49', true),
  ('f_033', 'school', 'v_luxor_2', '4 students, single mother 38', true),
  ('f_034', 'elderly', 'v_luxor_2', 'elderly couple 75, both ill', true),

  -- Sohag - Akhmim (5 families)
  ('f_035', 'ramadan', 'v_sohag_1', '3 children, disabled woman 43', true),
  ('f_036', 'school', 'v_sohag_1', '5 school children, widow 47', true),
  ('f_037', 'winter', 'v_sohag_1', '2 children, chronically ill mother 36', true),
  ('f_038', 'emergency', 'v_sohag_1', '4 children, evicted family', true),
  ('f_039', 'nutrition', 'v_sohag_1', 'triplets under 1, struggling mother 28', true),

  -- Sohag - Girga (4 families)
  ('f_040', 'ramadan', 'v_sohag_2', '4 children, single father 44', true),
  ('f_041', 'school', 'v_sohag_2', '3 children, elderly parents 68', true),
  ('f_042', 'winter', 'v_sohag_2', '5 children, poor housing family', true),
  ('f_043', 'elderly', 'v_sohag_2', 'disabled elderly man 82', true),

  -- Sohag - El Balyana (3 families)
  ('f_044', 'ramadan', 'v_sohag_3', '2 children, widow 34', true),
  ('f_045', 'emergency', 'v_sohag_3', '3 children, accident victim father', true),
  ('f_046', 'nutrition', 'v_sohag_3', '2 undernourished children, sick mother 32', true),

  -- Qena - Nag Hammadi (5 families)
  ('f_047', 'ramadan', 'v_qena_1', '5 children, unemployed father 50', true),
  ('f_048', 'school', 'v_qena_1', '4 school-age, disabled mother 40', true),
  ('f_049', 'winter', 'v_qena_1', '3 children, elderly caretaker 73', true),
  ('f_050', 'emergency', 'v_qena_1', '2 children, house collapse victims', true),
  ('f_051', 'nutrition', 'v_qena_1', '1 infant, 2 toddlers, young mother 24', true),

  -- Qena - Qus (4 families)
  ('f_052', 'ramadan', 'v_qena_2', '6 children, large poor family', true),
  ('f_053', 'school', 'v_qena_2', '3 students, single father 48', true),
  ('f_054', 'winter', 'v_qena_2', '4 children, seasonal income family', true),
  ('f_055', 'elderly', 'v_qena_2', 'elderly woman 79, no family support', true)
ON CONFLICT (id) DO UPDATE SET
  program_id = EXCLUDED.program_id,
  village_id = EXCLUDED.village_id,
  profile = EXCLUDED.profile,
  active = EXCLUDED.active,
  updated_at = NOW();

-- ============================================================================
-- 5. VERIFICATION QUERIES
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
  SELECT COUNT(*) INTO fam_count FROM families WHERE active = true;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Reference Data Seeding Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Governorates: %', gov_count;
  RAISE NOTICE 'Programs: %', prog_count;
  RAISE NOTICE 'Villages: %', vill_count;
  RAISE NOTICE 'Active Families: %', fam_count;
  RAISE NOTICE '========================================';
  
  -- Verify foreign key integrity
  PERFORM 1 FROM families f
  LEFT JOIN programs p ON f.program_id = p.id
  LEFT JOIN villages v ON f.village_id = v.id
  WHERE p.id IS NULL OR v.id IS NULL;
  
  IF FOUND THEN
    RAISE EXCEPTION 'Foreign key integrity violation detected!';
  ELSE
    RAISE NOTICE '✅ All foreign key relationships verified';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;