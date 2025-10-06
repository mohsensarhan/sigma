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
import { supabase } from '../supabaseClient';
import type { Anchor, Governorate, Village, Program, Family } from '../types/database';

// ============================================================================
// CACHE - Avoid duplicate Supabase queries
// ============================================================================
let governoratesCache: Governorate[] | null = null;
let programsCache: Program[] | null = null;

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

export async function getGovernorate(id: string): Promise<Governorate | undefined> {
  try {
    const { data, error } = await supabase.from('governorates').select('*').eq('id', id).single();

    if (error) {
      console.error('Supabase error fetching governorate:', error.message);
      return mockDatabase.governorates.find((g) => g.id === id);
    }

    if (!data) {return undefined;}

    return {
      id: data.id,
      name: data.name,
      weight: data.weight,
      strategicWarehouse: data.strategic_warehouse,
    };
  } catch (err) {
    console.error('Unexpected error fetching governorate:', err);
    return mockDatabase.governorates.find((g) => g.id === id);
  }
}

export async function getAllGovernorates(): Promise<Governorate[]> {
  // Return cached data if available
  if (governoratesCache) {
    return governoratesCache;
  }

  try {
    const { data, error } = await supabase.from('governorates').select('*').order('name');

    if (error) {
      console.error('❌ Supabase error fetching governorates:', error.message);
      console.warn('⚠️ Using fallback mockDatabase for governorates');
      return mockDatabase.governorates; // Fallback to mock data
    }

    if (import.meta.env.DEV) {
      console.log('✅ Supabase: Loaded', data?.length || 0, 'governorates (cached)');
    }

    // Transform and cache
    governoratesCache = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      weight: row.weight,
      strategicWarehouse: row.strategic_warehouse,
    }));

    return governoratesCache;
  } catch (err) {
    console.error('❌ Unexpected error fetching governorates:', err);
    console.warn('⚠️ Using fallback mockDatabase for governorates');
    return mockDatabase.governorates; // Fallback to mock data
  }
}

// ============================================================================
// VILLAGES
// ============================================================================

let villagesCache: Village[] | null = null;

export async function getVillage(id: string): Promise<Village | undefined> {
  try {
    const { data, error } = await supabase.from('villages').select('*').eq('id', id).single();

    if (error) {
      console.warn('⚠️ Supabase error fetching village, using fallback');
      return mockDatabase.villages.find((v) => v.id === id);
    }

    if (!data) {return undefined;}

    return {
      id: data.id,
      governorateId: data.governorate_id,
      name: data.name,
      lon: data.lon,
      lat: data.lat,
    };
  } catch (err) {
    console.warn('⚠️ Error fetching village, using fallback:', err);
    return mockDatabase.villages.find((v) => v.id === id);
  }
}

export async function getVillagesByGovernorate(governorateId: string): Promise<Village[]> {
  try {
    const { data, error } = await supabase
      .from('villages')
      .select('*')
      .eq('governorate_id', governorateId);

    if (error) {
      console.warn('⚠️ Supabase error fetching villages, using fallback');
      return mockDatabase.villages.filter((v) => v.governorateId === governorateId);
    }

    return (data || []).map((row) => ({
      id: row.id,
      governorateId: row.governorate_id,
      name: row.name,
      lon: row.lon,
      lat: row.lat,
    }));
  } catch (err) {
    console.warn('⚠️ Error fetching villages, using fallback:', err);
    return mockDatabase.villages.filter((v) => v.governorateId === governorateId);
  }
}

export async function getAllVillages(): Promise<Village[]> {
  // Return cached data if available
  if (villagesCache) {
    return villagesCache;
  }

  try {
    const { data, error } = await supabase.from('villages').select('*').order('name');

    if (error) {
      console.warn('⚠️ Supabase error fetching all villages, using fallback');
      return mockDatabase.villages;
    }

    if (import.meta.env.DEV) {
      console.log('✅ Supabase: Loaded', data?.length || 0, 'villages (cached)');
    }

    // Transform and cache
    villagesCache = (data || []).map((row) => ({
      id: row.id,
      governorateId: row.governorate_id,
      name: row.name,
      lon: row.lon,
      lat: row.lat,
    }));

    return villagesCache;
  } catch (err) {
    console.warn('⚠️ Error fetching all villages, using fallback:', err);
    return mockDatabase.villages;
  }
}

// ============================================================================
// PROGRAMS
// ============================================================================

export async function getProgram(id: string): Promise<Program | undefined> {
  try {
    const { data, error } = await supabase.from('programs').select('*').eq('id', id).single();

    if (error) {
      console.warn('⚠️ Supabase error fetching program, using fallback');
      return mockDatabase.programs.find((p) => p.id === id);
    }

    if (!data) {return undefined;}

    return {
      id: data.id,
      name: data.name,
      weight: data.weight,
    };
  } catch (err) {
    console.warn('⚠️ Error fetching program, using fallback:', err);
    return mockDatabase.programs.find((p) => p.id === id);
  }
}

export async function getAllPrograms(): Promise<Program[]> {
  // Return cached data if available
  if (programsCache) {
    return programsCache;
  }

  try {
    const { data, error } = await supabase.from('programs').select('*').order('name');

    if (error) {
      console.error('❌ Supabase error fetching programs:', error.message);
      console.warn('⚠️ Using fallback mockDatabase for programs');
      return mockDatabase.programs; // Fallback to mock data
    }

    if (import.meta.env.DEV) {
      console.log('✅ Supabase: Loaded', data?.length || 0, 'programs (cached)');
    }

    // Cache the result
    programsCache = data || [];
    return programsCache;
  } catch (err) {
    console.error('❌ Unexpected error fetching programs:', err);
    console.warn('⚠️ Using fallback mockDatabase for programs');
    return mockDatabase.programs; // Fallback to mock data
  }
}

// ============================================================================
// FAMILIES
// ============================================================================

export async function getFamily(id: string): Promise<Family | undefined> {
  try {
    const { data, error } = await supabase.from('families').select('*').eq('id', id).single();

    if (error) {
      console.warn('⚠️ Supabase error fetching family, using fallback');
      return mockDatabase.families.find((f) => f.id === id);
    }

    if (!data) {return undefined;}

    return {
      id: data.id,
      programId: data.program_id,
      villageId: data.village_id,
      profile: data.profile,
    };
  } catch (err) {
    console.warn('⚠️ Error fetching family, using fallback:', err);
    return mockDatabase.families.find((f) => f.id === id);
  }
}

export async function getFamiliesByProgram(programId: string): Promise<Family[]> {
  try {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('program_id', programId);

    if (error) {
      console.warn('⚠️ Supabase error fetching families by program, using fallback');
      return mockDatabase.families.filter((f) => f.programId === programId);
    }

    return (data || []).map((row) => ({
      id: row.id,
      programId: row.program_id,
      villageId: row.village_id,
      profile: row.profile,
    }));
  } catch (err) {
    console.warn('⚠️ Error fetching families by program, using fallback:', err);
    return mockDatabase.families.filter((f) => f.programId === programId);
  }
}

export async function getFamiliesByVillage(villageId: string): Promise<Family[]> {
  try {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('village_id', villageId);

    if (error) {
      console.warn('⚠️ Supabase error fetching families by village, using fallback');
      return mockDatabase.families.filter((f) => f.villageId === villageId);
    }

    return (data || []).map((row) => ({
      id: row.id,
      programId: row.program_id,
      villageId: row.village_id,
      profile: row.profile,
    }));
  } catch (err) {
    console.warn('⚠️ Error fetching families by village, using fallback:', err);
    return mockDatabase.families.filter((f) => f.villageId === villageId);
  }
}

export async function getFamiliesByProgramAndGovernorate(
  programId: string,
  governorateId: string
): Promise<Family[]> {
  try {
    // Get villages for this governorate
    const { data: villages, error: villageError } = await supabase
      .from('villages')
      .select('id')
      .eq('governorate_id', governorateId);

    if (villageError) {
      console.warn('⚠️ Supabase error fetching villages, using fallback');
      const governorateVillages = await getVillagesByGovernorate(governorateId);
      const villageIds = new Set(governorateVillages.map((v) => v.id));
      return mockDatabase.families.filter(
        (f) => f.programId === programId && villageIds.has(f.villageId)
      );
    }

    const villageIds = (villages || []).map((v) => v.id);

    // Get families matching program and villages
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('program_id', programId)
      .in('village_id', villageIds);

    if (error) {
      console.warn('⚠️ Supabase error fetching families, using fallback');
      const governorateVillages = await getVillagesByGovernorate(governorateId);
      const villageIdSet = new Set(governorateVillages.map((v) => v.id));
      return mockDatabase.families.filter(
        (f) => f.programId === programId && villageIdSet.has(f.villageId)
      );
    }

    if (import.meta.env.DEV) {
      console.log(
        '✅ Supabase: Found',
        data?.length || 0,
        'families for program',
        programId,
        'in',
        governorateId
      );
    }

    return (data || []).map((row) => ({
      id: row.id,
      programId: row.program_id,
      villageId: row.village_id,
      profile: row.profile,
    }));
  } catch (err) {
    console.warn('⚠️ Error fetching families, using fallback:', err);
    const governorateVillages = await getVillagesByGovernorate(governorateId);
    const villageIds = new Set(governorateVillages.map((v) => v.id));
    return mockDatabase.families.filter(
      (f) => f.programId === programId && villageIds.has(f.villageId)
    );
  }
}

export async function getFamiliesByGovernorate(governorateId: string): Promise<Family[]> {
  try {
    // Get villages for this governorate
    const villages = await getVillagesByGovernorate(governorateId);
    const villageIds = villages.map((v) => v.id);

    if (villageIds.length === 0) {
      return [];
    }

    // Get all families in these villages
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .in('village_id', villageIds);

    if (error) {
      console.warn('⚠️ Supabase error fetching families by governorate, using fallback');
      const villageIdSet = new Set(villageIds);
      return mockDatabase.families.filter((f) => villageIdSet.has(f.villageId));
    }

    return (data || []).map((row) => ({
      id: row.id,
      programId: row.program_id,
      villageId: row.village_id,
      profile: row.profile,
    }));
  } catch (err) {
    console.warn('⚠️ Error fetching families by governorate, using fallback:', err);
    const governorateVillages = await getVillagesByGovernorate(governorateId);
    const villageIds = new Set(governorateVillages.map((v) => v.id));
    return mockDatabase.families.filter((f) => villageIds.has(f.villageId));
  }
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
