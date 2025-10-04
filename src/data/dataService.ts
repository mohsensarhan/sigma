/**
 * TruPath V1 - Data Service Layer
 *
 * MIGRATION STRATEGY:
 * This is the ONLY file that knows about the data source.
 * When moving to Supabase:
 * 1. Replace mockDatabase imports with Supabase client
 * 2. Update function implementations to use async/await + Supabase queries
 * 3. Keep function signatures IDENTICAL
 * 4. No changes needed anywhere else in the codebase
 */

import { mockDatabase } from './mockDatabase';
import type {
  Anchor,
  Governorate,
  Village,
  Program,
  Family,
} from '../types/database';

// ============================================================================
// ANCHORS
// ============================================================================

export function getAnchor(key: string): Anchor | undefined {
  return mockDatabase.anchors.find((a) => a.key === key);
}

export function getAllAnchors(): Anchor[] {
  return mockDatabase.anchors;
}

// ============================================================================
// GOVERNORATES
// ============================================================================

export function getGovernorate(id: string): Governorate | undefined {
  return mockDatabase.governorates.find((g) => g.id === id);
}

export function getAllGovernorates(): Governorate[] {
  return mockDatabase.governorates;
}

// ============================================================================
// VILLAGES
// ============================================================================

export function getVillage(id: string): Village | undefined {
  return mockDatabase.villages.find((v) => v.id === id);
}

export function getVillagesByGovernorate(governorateId: string): Village[] {
  return mockDatabase.villages.filter((v) => v.governorateId === governorateId);
}

// ============================================================================
// PROGRAMS
// ============================================================================

export function getProgram(id: string): Program | undefined {
  return mockDatabase.programs.find((p) => p.id === id);
}

export function getAllPrograms(): Program[] {
  return mockDatabase.programs;
}

// ============================================================================
// FAMILIES
// ============================================================================

export function getFamily(id: string): Family | undefined {
  return mockDatabase.families.find((f) => f.id === id);
}

export function getFamiliesByProgram(programId: string): Family[] {
  return mockDatabase.families.filter((f) => f.programId === programId);
}

export function getFamiliesByVillage(villageId: string): Family[] {
  return mockDatabase.families.filter((f) => f.villageId === villageId);
}

export function getFamiliesByProgramAndGovernorate(
  programId: string,
  governorateId: string
): Family[] {
  const governorateVillages = getVillagesByGovernorate(governorateId);
  const villageIds = new Set(governorateVillages.map((v) => v.id));

  return mockDatabase.families.filter(
    (f) => f.programId === programId && villageIds.has(f.villageId)
  );
}

export function getFamiliesByGovernorate(governorateId: string): Family[] {
  const governorateVillages = getVillagesByGovernorate(governorateId);
  const villageIds = new Set(governorateVillages.map((v) => v.id));

  return mockDatabase.families.filter((f) => villageIds.has(f.villageId));
}

// ============================================================================
// FUTURE SUPABASE MIGRATION EXAMPLE
// ============================================================================

/*
// When migrating to Supabase, replace implementations like this:

import { supabase } from './supabaseClient';

export async function getGovernorate(id: string): Promise<Governorate | null> {
  const { data, error } = await supabase
    .from('governorates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching governorate:', error);
    return null;
  }

  return data;
}

export async function getAllGovernorates(): Promise<Governorate[]> {
  const { data, error } = await supabase
    .from('governorates')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching governorates:', error);
    return [];
  }

  return data || [];
}

// ALL function signatures remain the same (just add async/await)
// ALL business logic stays in selection algorithms and journey generator
// ZERO changes needed in components/hooks
*/
