/**
 * TruPath V1 - Selection Algorithm
 *
 * Implements weighted random selection for programs, governorates, and families.
 * All logic is deterministic and testable.
 */

import type {
  SelectionResult,
  DonationType,
} from '../types/database';
import {
  getAllPrograms,
  getAllGovernorates,
  getGovernorate,
  getProgram,
  getVillage,
  getFamiliesByProgramAndGovernorate,
  getFamiliesByGovernorate,
  getFamiliesByProgram,
} from './dataService';

// ============================================================================
// WEIGHTED RANDOM SELECTION
// ============================================================================

/**
 * Selects a random item from an array based on weights
 * @param items Array of items with weight property
 * @returns Selected item
 */
function weightedRandomSelection<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }

  // Fallback (should never reach here)
  return items[items.length - 1];
}

/**
 * Selects a random item from an array (uniform distribution)
 */
function uniformRandomSelection<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// ============================================================================
// SELECTION ALGORITHMS
// ============================================================================

/**
 * GENERAL DONATION: Randomize ALL (program + governorate + family)
 */
export function selectForGeneralDonation(): SelectionResult {
  // 1. Pick program (weighted random)
  const program = weightedRandomSelection(getAllPrograms());

  // 2. Pick governorate (weighted random)
  const governorate = weightedRandomSelection(getAllGovernorates());

  // 3. Get eligible families (program + governorate intersection)
  const eligibleFamilies = getFamiliesByProgramAndGovernorate(
    program.id,
    governorate.id
  );

  if (eligibleFamilies.length === 0) {
    throw new Error(
      `No families found for program ${program.name} in ${governorate.name}`
    );
  }

  // 4. Pick family (uniform random)
  const family = uniformRandomSelection(eligibleFamilies);

  // 5. Get village
  const village = getVillage(family.villageId);
  if (!village) {
    throw new Error(`Village not found for family ${family.id}`);
  }

  return { program, governorate, village, family };
}

/**
 * LOCATION-FIXED DONATION: Lock governorate, randomize program + family
 */
export function selectForLocationFixedDonation(
  governorateId: string
): SelectionResult {
  // 1. Get selected governorate
  const governorate = getGovernorate(governorateId);
  if (!governorate) {
    throw new Error(`Governorate ${governorateId} not found`);
  }

  // 2. Pick program (weighted random)
  const program = weightedRandomSelection(getAllPrograms());

  // 3. Get eligible families (program + governorate intersection)
  const eligibleFamilies = getFamiliesByProgramAndGovernorate(
    program.id,
    governorate.id
  );

  if (eligibleFamilies.length === 0) {
    // Fallback: try different program
    const allFamiliesInGovernorate = getFamiliesByGovernorate(governorate.id);
    if (allFamiliesInGovernorate.length === 0) {
      throw new Error(`No families found in ${governorate.name}`);
    }

    // Pick any family and use its program
    const family = uniformRandomSelection(allFamiliesInGovernorate);
    const fallbackProgram = getProgram(family.programId);
    if (!fallbackProgram) {
      throw new Error(`Program ${family.programId} not found`);
    }

    const village = getVillage(family.villageId);
    if (!village) {
      throw new Error(`Village not found for family ${family.id}`);
    }

    return { program: fallbackProgram, governorate, village, family };
  }

  // 4. Pick family (uniform random)
  const family = uniformRandomSelection(eligibleFamilies);

  // 5. Get village
  const village = getVillage(family.villageId);
  if (!village) {
    throw new Error(`Village not found for family ${family.id}`);
  }

  return { program, governorate, village, family };
}

/**
 * PROGRAM-FIXED DONATION: Lock program, randomize governorate + family
 */
export function selectForProgramFixedDonation(
  programId: string
): SelectionResult {
  // 1. Get selected program
  const program = getProgram(programId);
  if (!program) {
    throw new Error(`Program ${programId} not found`);
  }

  // 2. Pick governorate (weighted random)
  const governorate = weightedRandomSelection(getAllGovernorates());

  // 3. Get eligible families (program + governorate intersection)
  const eligibleFamilies = getFamiliesByProgramAndGovernorate(
    program.id,
    governorate.id
  );

  if (eligibleFamilies.length === 0) {
    // Fallback: try different governorate
    const allFamiliesInProgram = getFamiliesByProgram(program.id);
    if (allFamiliesInProgram.length === 0) {
      throw new Error(`No families found for program ${program.name}`);
    }

    // Pick any family and use its governorate
    const family = uniformRandomSelection(allFamiliesInProgram);
    const village = getVillage(family.villageId);
    if (!village) {
      throw new Error(`Village not found for family ${family.id}`);
    }

    const fallbackGovernorate = getGovernorate(village.governorateId);
    if (!fallbackGovernorate) {
      throw new Error(`Governorate ${village.governorateId} not found`);
    }

    return { program, governorate: fallbackGovernorate, village, family };
  }

  // 4. Pick family (uniform random)
  const family = uniformRandomSelection(eligibleFamilies);

  // 5. Get village
  const village = getVillage(family.villageId);
  if (!village) {
    throw new Error(`Village not found for family ${family.id}`);
  }

  return { program, governorate, village, family };
}

/**
 * Main selection function - routes to appropriate algorithm
 */
export function selectBeneficiary(
  type: DonationType,
  fixedId?: string
): SelectionResult {
  switch (type) {
    case 'general':
      return selectForGeneralDonation();

    case 'location-fixed':
      if (!fixedId) {
        throw new Error('Governorate ID required for location-fixed donation');
      }
      return selectForLocationFixedDonation(fixedId);

    case 'program-fixed':
      if (!fixedId) {
        throw new Error('Program ID required for program-fixed donation');
      }
      return selectForProgramFixedDonation(fixedId);

    default:
      throw new Error(`Unknown donation type: ${type}`);
  }
}
