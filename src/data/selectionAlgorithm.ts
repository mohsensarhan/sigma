/**
 * TruPath V1 - Selection Algorithm
 *
 * Implements weighted random selection for programs, governorates, and families.
 * All logic is deterministic and testable.
 */

import type { SelectionResult, DonationType } from '../types/database';
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
export async function selectForGeneralDonation(): Promise<SelectionResult> {
  // 1. Pick program (weighted random)
  const allPrograms = await getAllPrograms();
  const program = weightedRandomSelection(allPrograms);

  // 2. Pick governorate (weighted random)
  const allGovernorates = await getAllGovernorates();
  const governorate = weightedRandomSelection(allGovernorates);

  // 3. Get eligible families (program + governorate intersection)
  const eligibleFamilies = await getFamiliesByProgramAndGovernorate(program.id, governorate.id);

  if (eligibleFamilies.length === 0) {
    throw new Error(`No families found for program ${program.name} in ${governorate.name}`);
  }

  // 4. Pick family (uniform random)
  const family = uniformRandomSelection(eligibleFamilies);

  // 5. Get village
  const village = await getVillage(family.villageId);
  if (!village) {
    throw new Error(`Village not found for family ${family.id}`);
  }

  return { program, governorate, village, family };
}

/**
 * LOCATION-FIXED DONATION: Lock governorate, randomize program + family
 */
export async function selectForLocationFixedDonation(
  governorateId: string
): Promise<SelectionResult> {
  // 1. Get selected governorate
  const governorate = await getGovernorate(governorateId);
  if (!governorate) {
    throw new Error(`Governorate ${governorateId} not found`);
  }

  // 2. Pick program (weighted random)
  const allPrograms = await getAllPrograms();
  const program = weightedRandomSelection(allPrograms);

  // 3. Get eligible families (program + governorate intersection)
  const eligibleFamilies = await getFamiliesByProgramAndGovernorate(program.id, governorate.id);

  if (eligibleFamilies.length === 0) {
    // Fallback: try different program
    const allFamiliesInGovernorate = await getFamiliesByGovernorate(governorate.id);
    if (allFamiliesInGovernorate.length === 0) {
      throw new Error(`No families found in ${governorate.name}`);
    }

    // Pick any family and use its program
    const family = uniformRandomSelection(allFamiliesInGovernorate);
    const fallbackProgram = await getProgram(family.programId);
    if (!fallbackProgram) {
      throw new Error(`Program ${family.programId} not found`);
    }

    const village = await getVillage(family.villageId);
    if (!village) {
      throw new Error(`Village not found for family ${family.id}`);
    }

    return { program: fallbackProgram, governorate, village, family };
  }

  // 4. Pick family (uniform random)
  const family = uniformRandomSelection(eligibleFamilies);

  // 5. Get village
  const village = await getVillage(family.villageId);
  if (!village) {
    throw new Error(`Village not found for family ${family.id}`);
  }

  return { program, governorate, village, family };
}

/**
 * PROGRAM-FIXED DONATION: Lock program, randomize governorate + family
 */
export async function selectForProgramFixedDonation(programId: string): Promise<SelectionResult> {
  // 1. Get selected program
  const program = await getProgram(programId);
  if (!program) {
    throw new Error(`Program ${programId} not found`);
  }

  // 2. Pick governorate (weighted random)
  const allGovernorates = await getAllGovernorates();
  const governorate = weightedRandomSelection(allGovernorates);

  // 3. Get eligible families (program + governorate intersection)
  const eligibleFamilies = await getFamiliesByProgramAndGovernorate(program.id, governorate.id);

  if (eligibleFamilies.length === 0) {
    // Fallback: try different governorate
    const allFamiliesInProgram = await getFamiliesByProgram(program.id);
    if (allFamiliesInProgram.length === 0) {
      throw new Error(`No families found for program ${program.name}`);
    }

    // Pick any family and use its governorate
    const family = uniformRandomSelection(allFamiliesInProgram);
    const village = await getVillage(family.villageId);
    if (!village) {
      throw new Error(`Village not found for family ${family.id}`);
    }

    const fallbackGovernorate = await getGovernorate(village.governorateId);
    if (!fallbackGovernorate) {
      throw new Error(`Governorate ${village.governorateId} not found`);
    }

    return { program, governorate: fallbackGovernorate, village, family };
  }

  // 4. Pick family (uniform random)
  const family = uniformRandomSelection(eligibleFamilies);

  // 5. Get village
  const village = await getVillage(family.villageId);
  if (!village) {
    throw new Error(`Village not found for family ${family.id}`);
  }

  return { program, governorate, village, family };
}

/**
 * Main selection function - routes to appropriate algorithm
 */
export async function selectBeneficiary(
  type: DonationType,
  fixedId?: string
): Promise<SelectionResult> {
  switch (type) {
    case 'general':
      return await selectForGeneralDonation();

    case 'location-fixed':
      if (!fixedId) {
        throw new Error('Governorate ID required for location-fixed donation');
      }
      return await selectForLocationFixedDonation(fixedId);

    case 'program-fixed':
      if (!fixedId) {
        throw new Error('Program ID required for program-fixed donation');
      }
      return await selectForProgramFixedDonation(fixedId);

    default:
      throw new Error(`Unknown donation type: ${type}`);
  }
}
