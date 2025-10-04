/**
 * TruPath V1 - Mock Database
 *
 * This JSON structure EXACTLY mirrors the future Supabase schema.
 * Migration strategy: Replace this file with Supabase client calls in dataService.ts
 * No business logic here - pure data only.
 */

import type {
  Anchor,
  Governorate,
  Village,
  Program,
  Family,
} from '../types/database';

// ============================================================================
// FIXED ANCHORS (Always same for all journeys)
// ============================================================================

export const ANCHORS: Anchor[] = [
  {
    key: 'EFB_HQ',
    name: 'EFB HQ New Cairo',
    lon: 31.4486,
    lat: 30.0655,
  },
  {
    key: 'BADR_WAREHOUSE',
    name: 'Badr Warehouse',
    lon: 31.7357,
    lat: 30.1582,
  },
];

// ============================================================================
// GOVERNORATES (5 test regions)
// ============================================================================

export const GOVERNORATES: Governorate[] = [
  {
    id: 'minya',
    name: 'Minya',
    weight: 100,
    strategicWarehouse: {
      name: 'Minya Strategic Reserve',
      lon: 30.7503,
      lat: 28.1099,
    },
  },
  {
    id: 'aswan',
    name: 'Aswan',
    weight: 90,
    strategicWarehouse: {
      name: 'Aswan Strategic Reserve',
      lon: 32.8998,
      lat: 24.0889,
    },
  },
  {
    id: 'luxor',
    name: 'Luxor',
    weight: 95,
    strategicWarehouse: {
      name: 'Luxor Strategic Reserve',
      lon: 32.6396,
      lat: 25.6872,
    },
  },
  {
    id: 'sohag',
    name: 'Sohag',
    weight: 85,
    strategicWarehouse: {
      name: 'Sohag Strategic Reserve',
      lon: 31.6948,
      lat: 26.5569,
    },
  },
  {
    id: 'qena',
    name: 'Qena',
    weight: 80,
    strategicWarehouse: {
      name: 'Qena Strategic Reserve',
      lon: 32.7167,
      lat: 26.1551,
    },
  },
];

// ============================================================================
// VILLAGES (2-3 per governorate)
// ============================================================================

export const VILLAGES: Village[] = [
  // Minya villages
  { id: 'v_minya_1', governorateId: 'minya', name: 'Idamo', lon: 30.7234, lat: 28.0567 },
  { id: 'v_minya_2', governorateId: 'minya', name: 'Samalut', lon: 30.7092, lat: 28.3089 },
  { id: 'v_minya_3', governorateId: 'minya', name: 'Beni Mazar', lon: 30.7986, lat: 28.4944 },

  // Aswan villages
  { id: 'v_aswan_1', governorateId: 'aswan', name: 'Kom Ombo', lon: 32.9318, lat: 24.4764 },
  { id: 'v_aswan_2', governorateId: 'aswan', name: 'Edfu', lon: 32.8742, lat: 24.9781 },
  { id: 'v_aswan_3', governorateId: 'aswan', name: 'Daraw', lon: 32.9156, lat: 24.3547 },

  // Luxor villages
  { id: 'v_luxor_1', governorateId: 'luxor', name: 'Armant', lon: 32.5331, lat: 25.6167 },
  { id: 'v_luxor_2', governorateId: 'luxor', name: 'Esna', lon: 32.5533, lat: 25.2933 },

  // Sohag villages
  { id: 'v_sohag_1', governorateId: 'sohag', name: 'Akhmim', lon: 31.7472, lat: 26.5667 },
  { id: 'v_sohag_2', governorateId: 'sohag', name: 'Girga', lon: 31.8917, lat: 26.3406 },
  { id: 'v_sohag_3', governorateId: 'sohag', name: 'El Balyana', lon: 32.0047, lat: 26.2358 },

  // Qena villages
  { id: 'v_qena_1', governorateId: 'qena', name: 'Nag Hammadi', lon: 32.2397, lat: 26.0489 },
  { id: 'v_qena_2', governorateId: 'qena', name: 'Qus', lon: 32.7597, lat: 25.9147 },
];

// ============================================================================
// PROGRAMS (5-6 EFB programs)
// ============================================================================

export const PROGRAMS: Program[] = [
  { id: 'ramadan', name: 'Ramadan Food Parcels', weight: 100 },
  { id: 'school', name: 'School Meal Program', weight: 90 },
  { id: 'winter', name: 'Winter Relief Packages', weight: 85 },
  { id: 'emergency', name: 'Emergency Food Aid', weight: 95 },
  { id: 'nutrition', name: 'Child Nutrition Support', weight: 80 },
  { id: 'elderly', name: 'Elderly Care Packages', weight: 75 },
];

// ============================================================================
// FAMILIES (2-3 per program per village = ~78 families)
// ============================================================================

export const FAMILIES: Family[] = [
  // Minya - Idamo
  { id: 'f_001', programId: 'ramadan', villageId: 'v_minya_1', profile: '3 children, single mother, disabled woman 55' },
  { id: 'f_002', programId: 'school', villageId: 'v_minya_1', profile: '4 children, elderly grandmother 68' },
  { id: 'f_003', programId: 'winter', villageId: 'v_minya_1', profile: '2 children, single father, widow 42' },
  { id: 'f_004', programId: 'emergency', villageId: 'v_minya_1', profile: '5 children, unemployed father, sick mother' },
  { id: 'f_005', programId: 'nutrition', villageId: 'v_minya_1', profile: '1 infant, 2 toddlers, single mother 29' },
  { id: 'f_006', programId: 'elderly', villageId: 'v_minya_1', profile: 'elderly couple 72, no income' },

  // Minya - Samalut
  { id: 'f_007', programId: 'ramadan', villageId: 'v_minya_2', profile: '6 children, disabled father 48' },
  { id: 'f_008', programId: 'school', villageId: 'v_minya_2', profile: '3 school-age children, widow 39' },
  { id: 'f_009', programId: 'winter', villageId: 'v_minya_2', profile: '2 children, elderly parents 65' },
  { id: 'f_010', programId: 'emergency', villageId: 'v_minya_2', profile: '4 children, recently displaced family' },
  { id: 'f_011', programId: 'nutrition', villageId: 'v_minya_2', profile: 'twins under 2, malnourished mother 26' },

  // Minya - Beni Mazar
  { id: 'f_012', programId: 'ramadan', villageId: 'v_minya_3', profile: '4 children, chronically ill father 51' },
  { id: 'f_013', programId: 'school', villageId: 'v_minya_3', profile: '5 school children, single mother 44' },
  { id: 'f_014', programId: 'elderly', villageId: 'v_minya_3', profile: 'disabled elderly woman 81, lives alone' },

  // Aswan - Kom Ombo
  { id: 'f_015', programId: 'ramadan', villageId: 'v_aswan_1', profile: '3 children, widow 37' },
  { id: 'f_016', programId: 'school', villageId: 'v_aswan_1', profile: '2 children, disabled mother 33' },
  { id: 'f_017', programId: 'winter', villageId: 'v_aswan_1', profile: '4 children, seasonal worker father' },
  { id: 'f_018', programId: 'emergency', villageId: 'v_aswan_1', profile: '3 children, fire victim family' },
  { id: 'f_019', programId: 'nutrition', villageId: 'v_aswan_1', profile: '1 newborn, 3 under-5 children' },

  // Aswan - Edfu
  { id: 'f_020', programId: 'ramadan', villageId: 'v_aswan_2', profile: '5 children, unemployed parents' },
  { id: 'f_021', programId: 'school', villageId: 'v_aswan_2', profile: '4 school-age, single father 46' },
  { id: 'f_022', programId: 'winter', villageId: 'v_aswan_2', profile: '2 children, elderly caretaker 70' },
  { id: 'f_023', programId: 'elderly', villageId: 'v_aswan_2', profile: 'elderly man 78, diabetic' },

  // Aswan - Daraw
  { id: 'f_024', programId: 'ramadan', villageId: 'v_aswan_3', profile: '7 children, large family in poverty' },
  { id: 'f_025', programId: 'emergency', villageId: 'v_aswan_3', profile: '3 children, flood-affected family' },
  { id: 'f_026', programId: 'nutrition', villageId: 'v_aswan_3', profile: '2 malnourished children, sick mother 31' },

  // Luxor - Armant
  { id: 'f_027', programId: 'ramadan', villageId: 'v_luxor_1', profile: '4 children, widow 41' },
  { id: 'f_028', programId: 'school', villageId: 'v_luxor_1', profile: '3 children, disabled father 52' },
  { id: 'f_029', programId: 'winter', villageId: 'v_luxor_1', profile: '2 children, elderly grandmother caring' },
  { id: 'f_030', programId: 'emergency', villageId: 'v_luxor_1', profile: '5 children, medical crisis family' },
  { id: 'f_031', programId: 'nutrition', villageId: 'v_luxor_1', profile: '1 infant, 1 toddler, young mother 23' },

  // Luxor - Esna
  { id: 'f_032', programId: 'ramadan', villageId: 'v_luxor_2', profile: '6 children, unemployed father 49' },
  { id: 'f_033', programId: 'school', villageId: 'v_luxor_2', profile: '4 students, single mother 38' },
  { id: 'f_034', programId: 'elderly', villageId: 'v_luxor_2', profile: 'elderly couple 75, both ill' },

  // Sohag - Akhmim
  { id: 'f_035', programId: 'ramadan', villageId: 'v_sohag_1', profile: '3 children, disabled woman 43' },
  { id: 'f_036', programId: 'school', villageId: 'v_sohag_1', profile: '5 school children, widow 47' },
  { id: 'f_037', programId: 'winter', villageId: 'v_sohag_1', profile: '2 children, chronically ill mother 36' },
  { id: 'f_038', programId: 'emergency', villageId: 'v_sohag_1', profile: '4 children, evicted family' },
  { id: 'f_039', programId: 'nutrition', villageId: 'v_sohag_1', profile: 'triplets under 1, struggling mother 28' },

  // Sohag - Girga
  { id: 'f_040', programId: 'ramadan', villageId: 'v_sohag_2', profile: '4 children, single father 44' },
  { id: 'f_041', programId: 'school', villageId: 'v_sohag_2', profile: '3 children, elderly parents 68' },
  { id: 'f_042', programId: 'winter', villageId: 'v_sohag_2', profile: '5 children, poor housing family' },
  { id: 'f_043', programId: 'elderly', villageId: 'v_sohag_2', profile: 'disabled elderly man 82' },

  // Sohag - El Balyana
  { id: 'f_044', programId: 'ramadan', villageId: 'v_sohag_3', profile: '2 children, widow 34' },
  { id: 'f_045', programId: 'emergency', villageId: 'v_sohag_3', profile: '3 children, accident victim father' },
  { id: 'f_046', programId: 'nutrition', villageId: 'v_sohag_3', profile: '2 undernourished children, sick mother 32' },

  // Qena - Nag Hammadi
  { id: 'f_047', programId: 'ramadan', villageId: 'v_qena_1', profile: '5 children, unemployed father 50' },
  { id: 'f_048', programId: 'school', villageId: 'v_qena_1', profile: '4 school-age, disabled mother 40' },
  { id: 'f_049', programId: 'winter', villageId: 'v_qena_1', profile: '3 children, elderly caretaker 73' },
  { id: 'f_050', programId: 'emergency', villageId: 'v_qena_1', profile: '2 children, house collapse victims' },
  { id: 'f_051', programId: 'nutrition', villageId: 'v_qena_1', profile: '1 infant, 2 toddlers, young mother 24' },

  // Qena - Qus
  { id: 'f_052', programId: 'ramadan', villageId: 'v_qena_2', profile: '6 children, large poor family' },
  { id: 'f_053', programId: 'school', villageId: 'v_qena_2', profile: '3 students, single father 48' },
  { id: 'f_054', programId: 'winter', villageId: 'v_qena_2', profile: '4 children, seasonal income family' },
  { id: 'f_055', programId: 'elderly', villageId: 'v_qena_2', profile: 'elderly woman 79, no family support' },
];

// ============================================================================
// DATABASE EXPORT
// ============================================================================

export const mockDatabase = {
  anchors: ANCHORS,
  governorates: GOVERNORATES,
  villages: VILLAGES,
  programs: PROGRAMS,
  families: FAMILIES,
};
