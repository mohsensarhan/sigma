/**
 * Journey Service - Supabase Persistence
 * Handles saving/loading journeys to/from Supabase database
 *
 * Features:
 * - Dual persistence: localStorage (immediate) + Supabase (durable)
 * - Automatic sync on journey registration/update
 * - Graceful fallback to localStorage on Supabase errors
 */

import { supabase } from '../supabaseClient';
import type { Journey } from '../types/journey';

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE_PERSISTENCE !== 'false'; // Default to true

/**
 * Save journey to Supabase
 */
export async function saveJourneyToSupabase(journey: Journey): Promise<boolean> {
  if (!USE_SUPABASE) {
    console.log('📂 [SKIP] Supabase persistence disabled');
    return false;
  }

  try {
    // Insert journey record
    const { error: journeyError } = await supabase.from('journeys').insert({
      id: journey.id,
      donor_id: journey.metadata?.donorId || null,
      type: journey.type,
      status: journey.status,
      current_stage: journey.currentStage,
      started_at: new Date(journey.startedAt).toISOString(),
      completed_at: journey.completedAt ? new Date(journey.completedAt).toISOString() : null,
      governorate_id: journey.metadata?.governorateId || null,
      program_id: journey.metadata?.programId || null,
      family_id: journey.metadata?.familyId || null,
      donor_name: journey.metadata?.donorName || null,
      donor_phone: journey.metadata?.donorPhone || null,
      donor_email: journey.metadata?.donorEmail || null,
      amount: journey.metadata?.amount || null,
      metadata: journey.metadata || {},
    });

    if (journeyError) {
      // Check if it's a duplicate key error (journey already exists)
      if (journeyError.code === '23505') {
        console.log('⚠️ Journey already exists in Supabase, updating instead:', journey.id);
        return updateJourneyInSupabase(journey.id, journey);
      }
      throw journeyError;
    }

    // Insert journey events (waypoints)
    const eventsToInsert = journey.waypoints.map((waypoint, index) => ({
      journey_id: journey.id,
      stage: waypoint.id,
      stage_name: waypoint.name,
      location: waypoint.location,
      lon: waypoint.coordinates[0],
      lat: waypoint.coordinates[1],
      status: waypoint.status,
      completed_at: waypoint.status === 'completed' ? new Date().toISOString() : null,
      metadata: {
        packageId: waypoint.details.packageId,
        items: waypoint.details.items,
        quantity: waypoint.details.quantity,
        beneficiaries: waypoint.details.beneficiaries,
        handler: waypoint.details.handler,
        ...waypoint.details,
      },
    }));

    const { error: eventsError } = await supabase.from('journey_events').insert(eventsToInsert);

    if (eventsError) {throw eventsError;}

    console.log('✅ Journey saved to Supabase:', journey.id);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to save journey to Supabase:', error.message);
    return false;
  }
}

/**
 * Update journey in Supabase
 */
export async function updateJourneyInSupabase(
  journeyId: string,
  updates: Partial<Journey>
): Promise<boolean> {
  if (!USE_SUPABASE) {
    return false;
  }

  try {
    // Update journey record
    const journeyUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status !== undefined) {
      journeyUpdates.status = updates.status;
    }

    if (updates.currentStage !== undefined) {
      journeyUpdates.current_stage = updates.currentStage;
    }

    if (updates.completedAt !== undefined) {
      journeyUpdates.completed_at = updates.completedAt
        ? new Date(updates.completedAt).toISOString()
        : null;
    }

    const { error: journeyError } = await supabase
      .from('journeys')
      .update(journeyUpdates)
      .eq('id', journeyId);

    if (journeyError) {throw journeyError;}

    // Update waypoints if provided
    if (updates.waypoints) {
      for (const waypoint of updates.waypoints) {
        const { error: eventError } = await supabase
          .from('journey_events')
          .update({
            status: waypoint.status,
            completed_at: waypoint.status === 'completed' ? new Date().toISOString() : null,
          })
          .eq('journey_id', journeyId)
          .eq('stage', waypoint.id);

        if (eventError) {
          console.error(`Failed to update waypoint ${waypoint.id}:`, eventError.message);
        }
      }
    }

    console.log('✅ Journey updated in Supabase:', journeyId);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to update journey in Supabase:', error.message);
    return false;
  }
}

/**
 * Load all journeys for a donor from Supabase
 */
export async function loadJourneysFromSupabase(donorId?: string): Promise<Journey[]> {
  if (!USE_SUPABASE) {
    console.log('📂 [SKIP] Supabase persistence disabled');
    return [];
  }

  try {
    let query = supabase
      .from('journeys')
      .select(
        `
        *,
        journey_events (*)
      `
      )
      .order('created_at', { ascending: false });

    // Filter by donor if provided
    if (donorId) {
      query = query.eq('donor_id', donorId);
    }

    const { data, error } = await query;

    if (error) {throw error;}

    if (!data || data.length === 0) {
      console.log('📂 No journeys found in Supabase');
      return [];
    }

    // Transform Supabase data to Journey format
    const journeys: Journey[] = data.map((j) => {
      // Sort events by stage
      const sortedEvents = (j.journey_events || []).sort((a: any, b: any) => a.stage - b.stage);

      return {
        id: j.id,
        type: j.type,
        status: j.status,
        currentStage: j.current_stage,
        startedAt: new Date(j.started_at).getTime(),
        completedAt: j.completed_at ? new Date(j.completed_at).getTime() : undefined,
        waypoints: sortedEvents.map((e: any) => ({
          id: e.stage,
          name: e.stage_name,
          location: e.location,
          coordinates: [e.lon, e.lat] as [number, number],
          stage: `Stage ${e.stage}`,
          status: e.status,
          timestamp: new Date(e.created_at).toISOString(),
          details: {
            packageId: e.metadata?.packageId || j.id,
            items: e.metadata?.items || [],
            quantity: e.metadata?.quantity || 0,
            beneficiaries: e.metadata?.beneficiaries || 0,
            handler: e.metadata?.handler || 'Unknown',
            ...e.metadata,
          },
        })),
        metadata: {
          governorate: j.governorate_id,
          program: j.program_id,
          familyId: j.family_id,
          donorId: j.donor_id,
          donorName: j.donor_name,
          donorPhone: j.donor_phone,
          donorEmail: j.donor_email,
          amount: j.amount ? parseFloat(j.amount) : undefined,
          ...(j.metadata || {}),
        },
      };
    });

    console.log(`✅ Loaded ${journeys.length} journeys from Supabase`);
    return journeys;
  } catch (error: any) {
    console.error('❌ Failed to load journeys from Supabase:', error.message);
    return [];
  }
}

/**
 * Load a single journey by ID from Supabase
 */
export async function getJourneyFromSupabase(journeyId: string): Promise<Journey | null> {
  if (!USE_SUPABASE) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('journeys')
      .select(
        `
        *,
        journey_events (*)
      `
      )
      .eq('id', journeyId)
      .single();

    if (error) {throw error;}
    if (!data) {return null;}

    // Sort events by stage
    const sortedEvents = (data.journey_events || []).sort((a: any, b: any) => a.stage - b.stage);

    const journey: Journey = {
      id: data.id,
      type: data.type,
      status: data.status,
      currentStage: data.current_stage,
      startedAt: new Date(data.started_at).getTime(),
      completedAt: data.completed_at ? new Date(data.completed_at).getTime() : undefined,
      waypoints: sortedEvents.map((e: any) => ({
        id: e.stage,
        name: e.stage_name,
        location: e.location,
        coordinates: [e.lon, e.lat] as [number, number],
        stage: `Stage ${e.stage}`,
        status: e.status,
        timestamp: new Date(e.created_at).toISOString(),
        details: {
          packageId: e.metadata?.packageId || data.id,
          items: e.metadata?.items || [],
          quantity: e.metadata?.quantity || 0,
          beneficiaries: e.metadata?.beneficiaries || 0,
          handler: e.metadata?.handler || 'Unknown',
          ...e.metadata,
        },
      })),
      metadata: {
        governorate: data.governorate_id,
        program: data.program_id,
        familyId: data.family_id,
        donorId: data.donor_id,
        donorName: data.donor_name,
        donorPhone: data.donor_phone,
        donorEmail: data.donor_email,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        ...(data.metadata || {}),
      },
    };

    return journey;
  } catch (error: any) {
    console.error('❌ Failed to load journey from Supabase:', error.message);
    return null;
  }
}

/**
 * Delete journey from Supabase (cascade deletes events)
 */
export async function deleteJourneyFromSupabase(journeyId: string): Promise<boolean> {
  if (!USE_SUPABASE) {
    return false;
  }

  try {
    const { error } = await supabase.from('journeys').delete().eq('id', journeyId);

    if (error) {throw error;}

    console.log('✅ Journey deleted from Supabase:', journeyId);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to delete journey from Supabase:', error.message);
    return false;
  }
}

/**
 * Get journey statistics from Supabase
 */
export async function getJourneyStats(): Promise<{
  total: number;
  active: number;
  completed: number;
  failed: number;
}> {
  if (!USE_SUPABASE) {
    return { total: 0, active: 0, completed: 0, failed: 0 };
  }

  try {
    const { data, error } = await supabase.from('journeys').select('status');

    if (error) {throw error;}

    const total = data?.length || 0;
    const active = data?.filter((j) => j.status === 'active').length || 0;
    const completed = data?.filter((j) => j.status === 'completed').length || 0;
    const failed = data?.filter((j) => j.status === 'failed').length || 0;

    return { total, active, completed, failed };
  } catch (error: any) {
    console.error('❌ Failed to get journey stats from Supabase:', error.message);
    return { total: 0, active: 0, completed: 0, failed: 0 };
  }
}

// Log service mode on initialization
console.log(
  `📂 Journey Service initialized with ${USE_SUPABASE ? 'SUPABASE' : 'LOCALSTORAGE'} persistence`
);
