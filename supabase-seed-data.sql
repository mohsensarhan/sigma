-- ============================================================================
-- TruPath V1 - Data Seeding Script
-- Inserts all data from mockDatabase.ts into Supabase
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Insert Anchors (2 fixed points)
INSERT INTO anchors (key, name, lon, lat) VALUES
  ('EFB_HQ', 'EFB HQ New Cairo', 31.4486, 30.0655),
  ('BADR_WAREHOUSE', 'Badr Warehouse', 31.7357, 30.1582)
ON CONFLICT (key) DO NOTHING;

-- Step 2: Insert Governorates (5 regions)
INSERT INTO governorates (id, name, weight, strategic_warehouse) VALUES
  ('minya', 'Minya', 100, '{"name": "Minya Strategic Reserve", "lon": 30.7503, "lat": 28.1099}'),
  ('aswan', 'Aswan', 90, '{"name": "Aswan Strategic Reserve", "lon": 32.8998, "lat": 24.0889}'),
  ('luxor', 'Luxor', 95, '{"name": "Luxor Strategic Reserve", "lon": 32.6396, "lat": 25.6872}'),
  ('sohag', 'Sohag', 85, '{"name": "Sohag Strategic Reserve", "lon": 31.6948, "lat": 26.5569}'),
  ('qena', 'Qena', 80, '{"name": "Qena Strategic Reserve", "lon": 32.7167, "lat": 26.1551}')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Insert Villages (12 villages)
INSERT INTO villages (id, governorate_id, name, lon, lat) VALUES
  -- Minya villages
  ('v_minya_1', 'minya', 'Idamo', 30.7234, 28.0567),
  ('v_minya_2', 'minya', 'Samalut', 30.7092, 28.3089),
  ('v_minya_3', 'minya', 'Beni Mazar', 30.7986, 28.4944),

  -- Aswan villages
  ('v_aswan_1', 'aswan', 'Kom Ombo', 32.9318, 24.4764),
  ('v_aswan_2', 'aswan', 'Edfu', 32.8742, 24.9781),
  ('v_aswan_3', 'aswan', 'Daraw', 32.9156, 24.3547),

  -- Luxor villages
  ('v_luxor_1', 'luxor', 'Armant', 32.5331, 25.6167),
  ('v_luxor_2', 'luxor', 'Esna', 32.5533, 25.2933),

  -- Sohag villages
  ('v_sohag_1', 'sohag', 'Akhmim', 31.7472, 26.5667),
  ('v_sohag_2', 'sohag', 'Girga', 31.8917, 26.3406),
  ('v_sohag_3', 'sohag', 'El Balyana', 32.0047, 26.2358),

  -- Qena villages
  ('v_qena_1', 'qena', 'Nag Hammadi', 32.2397, 26.0489),
  ('v_qena_2', 'qena', 'Qus', 32.7597, 25.9147)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Insert Programs (6 programs)
INSERT INTO programs (id, name, weight) VALUES
  ('ramadan', 'Ramadan Food Parcels', 100),
  ('school', 'School Meal Program', 90),
  ('winter', 'Winter Relief Packages', 85),
  ('emergency', 'Emergency Food Aid', 95),
  ('nutrition', 'Child Nutrition Support', 80),
  ('elderly', 'Elderly Care Packages', 75)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Insert Families (55 families)
INSERT INTO families (id, program_id, village_id, profile) VALUES
  -- Minya - Idamo
  ('f_001', 'ramadan', 'v_minya_1', '3 children, single mother, disabled woman 55'),
  ('f_002', 'school', 'v_minya_1', '4 children, elderly grandmother 68'),
  ('f_003', 'winter', 'v_minya_1', '2 children, single father, widow 42'),
  ('f_004', 'emergency', 'v_minya_1', '5 children, unemployed father, sick mother'),
  ('f_005', 'nutrition', 'v_minya_1', '1 infant, 2 toddlers, single mother 29'),
  ('f_006', 'elderly', 'v_minya_1', 'elderly couple 72, no income'),

  -- Minya - Samalut
  ('f_007', 'ramadan', 'v_minya_2', '6 children, disabled father 48'),
  ('f_008', 'school', 'v_minya_2', '3 school-age children, widow 39'),
  ('f_009', 'winter', 'v_minya_2', '2 children, elderly parents 65'),
  ('f_010', 'emergency', 'v_minya_2', '4 children, recently displaced family'),
  ('f_011', 'nutrition', 'v_minya_2', 'twins under 2, malnourished mother 26'),

  -- Minya - Beni Mazar
  ('f_012', 'ramadan', 'v_minya_3', '4 children, chronically ill father 51'),
  ('f_013', 'school', 'v_minya_3', '5 school children, single mother 44'),
  ('f_014', 'elderly', 'v_minya_3', 'disabled elderly woman 81, lives alone'),

  -- Aswan - Kom Ombo
  ('f_015', 'ramadan', 'v_aswan_1', '3 children, widow 37'),
  ('f_016', 'school', 'v_aswan_1', '2 children, disabled mother 33'),
  ('f_017', 'winter', 'v_aswan_1', '4 children, seasonal worker father'),
  ('f_018', 'emergency', 'v_aswan_1', '3 children, fire victim family'),
  ('f_019', 'nutrition', 'v_aswan_1', '1 newborn, 3 under-5 children'),

  -- Aswan - Edfu
  ('f_020', 'ramadan', 'v_aswan_2', '5 children, unemployed parents'),
  ('f_021', 'school', 'v_aswan_2', '4 school-age, single father 46'),
  ('f_022', 'winter', 'v_aswan_2', '2 children, elderly caretaker 70'),
  ('f_023', 'elderly', 'v_aswan_2', 'elderly man 78, diabetic'),

  -- Aswan - Daraw
  ('f_024', 'ramadan', 'v_aswan_3', '7 children, large family in poverty'),
  ('f_025', 'emergency', 'v_aswan_3', '3 children, flood-affected family'),
  ('f_026', 'nutrition', 'v_aswan_3', '2 malnourished children, sick mother 31'),

  -- Luxor - Armant
  ('f_027', 'ramadan', 'v_luxor_1', '4 children, widow 41'),
  ('f_028', 'school', 'v_luxor_1', '3 children, disabled father 52'),
  ('f_029', 'winter', 'v_luxor_1', '2 children, elderly grandmother caring'),
  ('f_030', 'emergency', 'v_luxor_1', '5 children, medical crisis family'),
  ('f_031', 'nutrition', 'v_luxor_1', '1 infant, 1 toddler, young mother 23'),

  -- Luxor - Esna
  ('f_032', 'ramadan', 'v_luxor_2', '6 children, unemployed father 49'),
  ('f_033', 'school', 'v_luxor_2', '4 students, single mother 38'),
  ('f_034', 'elderly', 'v_luxor_2', 'elderly couple 75, both ill'),

  -- Sohag - Akhmim
  ('f_035', 'ramadan', 'v_sohag_1', '3 children, disabled woman 43'),
  ('f_036', 'school', 'v_sohag_1', '5 school children, widow 47'),
  ('f_037', 'winter', 'v_sohag_1', '2 children, chronically ill mother 36'),
  ('f_038', 'emergency', 'v_sohag_1', '4 children, evicted family'),
  ('f_039', 'nutrition', 'v_sohag_1', 'triplets under 1, struggling mother 28'),

  -- Sohag - Girga
  ('f_040', 'ramadan', 'v_sohag_2', '4 children, single father 44'),
  ('f_041', 'school', 'v_sohag_2', '3 children, elderly parents 68'),
  ('f_042', 'winter', 'v_sohag_2', '5 children, poor housing family'),
  ('f_043', 'elderly', 'v_sohag_2', 'disabled elderly man 82'),

  -- Sohag - El Balyana
  ('f_044', 'ramadan', 'v_sohag_3', '2 children, widow 34'),
  ('f_045', 'emergency', 'v_sohag_3', '3 children, accident victim father'),
  ('f_046', 'nutrition', 'v_sohag_3', '2 undernourished children, sick mother 32'),

  -- Qena - Nag Hammadi
  ('f_047', 'ramadan', 'v_qena_1', '5 children, unemployed father 50'),
  ('f_048', 'school', 'v_qena_1', '4 school-age, disabled mother 40'),
  ('f_049', 'winter', 'v_qena_1', '3 children, elderly caretaker 73'),
  ('f_050', 'emergency', 'v_qena_1', '2 children, house collapse victims'),
  ('f_051', 'nutrition', 'v_qena_1', '1 infant, 2 toddlers, young mother 24'),

  -- Qena - Qus
  ('f_052', 'ramadan', 'v_qena_2', '6 children, large poor family'),
  ('f_053', 'school', 'v_qena_2', '3 students, single father 48'),
  ('f_054', 'winter', 'v_qena_2', '4 children, seasonal income family'),
  ('f_055', 'elderly', 'v_qena_2', 'elderly woman 79, no family support')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Verification Queries
-- Run these to confirm data was inserted correctly
-- ============================================================================

-- Should return 2
SELECT COUNT(*) as anchor_count FROM anchors;

-- Should return 5
SELECT COUNT(*) as governorate_count FROM governorates;

-- Should return 12
SELECT COUNT(*) as village_count FROM villages;

-- Should return 6
SELECT COUNT(*) as program_count FROM programs;

-- Should return 55
SELECT COUNT(*) as family_count FROM families;

-- Show all data
SELECT 'Anchors' as table_name, COUNT(*) as count FROM anchors
UNION ALL
SELECT 'Governorates', COUNT(*) FROM governorates
UNION ALL
SELECT 'Villages', COUNT(*) FROM villages
UNION ALL
SELECT 'Programs', COUNT(*) FROM programs
UNION ALL
SELECT 'Families', COUNT(*) FROM families;
