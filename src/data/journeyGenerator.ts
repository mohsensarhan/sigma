/**
 * TruPath V1 - Journey Generator
 *
 * Generates the 5-stage journey route for any donation.
 * All journeys follow the same structure:
 * 1. EFB HQ New Cairo (fixed)
 * 2. Badr Warehouse (fixed)
 * 3. [Governorate] Strategic Reserve Warehouse
 * 4. [Village] Touchpoint
 * 5. Delivered to Family [profile]
 */

import type { SelectionResult } from '../types/database';
import type { Waypoint } from './waypoints';
import { getAnchor } from './dataService';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Generate a unique tracking token
 */
function generateTrackingToken(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `EFB-${new Date().getFullYear()}-${timestamp}-${random}`;
}

// ============================================================================
// JOURNEY GENERATION
// ============================================================================

/**
 * Generates a complete 5-stage journey based on selection result
 */
export function generateJourney(selection: SelectionResult): Waypoint[] {
  const { governorate, village, family } = selection;

  // Get fixed anchors
  const efbHQ = getAnchor('EFB_HQ');
  const badrWarehouse = getAnchor('BADR_WAREHOUSE');

  if (!efbHQ || !badrWarehouse) {
    throw new Error('Fixed anchors not found in database');
  }

  const trackingToken = generateTrackingToken();

  // Standard package items for all donations (can be customized later)
  const standardItems = ['Rice (25kg)', 'Cooking Oil (10L)', 'Lentils (15kg)', 'Sugar (10kg)'];

  // ============================================================================
  // STAGE 1: Received at EFB HQ New Cairo
  // ============================================================================
  const stage1: Waypoint = {
    id: 1,
    name: 'Donation Received',
    location: efbHQ.name,
    coordinates: [efbHQ.lon, efbHQ.lat],
    stage: 'Stage 1',
    status: 'pending',
    timestamp: new Date().toISOString(),
    details: {
      packageId: trackingToken,
      items: standardItems,
      quantity: 60,
      beneficiaries: 1,
      handler: 'EFB HQ Operations',
    },
  };

  // ============================================================================
  // STAGE 2: Received at Badr Warehouse
  // ============================================================================
  const distanceStage1to2 = calculateDistance(
    efbHQ.lon,
    efbHQ.lat,
    badrWarehouse.lon,
    badrWarehouse.lat
  );

  const stage2: Waypoint = {
    id: 2,
    name: 'Processing at Warehouse',
    location: badrWarehouse.name,
    coordinates: [badrWarehouse.lon, badrWarehouse.lat],
    stage: 'Stage 2',
    status: 'pending',
    timestamp: new Date().toISOString(),
    details: {
      packageId: trackingToken,
      items: standardItems,
      quantity: 60,
      beneficiaries: 1,
      distanceFromPrevious: distanceStage1to2,
      handler: 'Badr Logistics Team',
    },
  };

  // ============================================================================
  // STAGE 3: Received at Governorate Strategic Reserve
  // ============================================================================
  const { strategicWarehouse } = governorate;
  const distanceStage2to3 = calculateDistance(
    badrWarehouse.lon,
    badrWarehouse.lat,
    strategicWarehouse.lon,
    strategicWarehouse.lat
  );

  const stage3: Waypoint = {
    id: 3,
    name: 'Allocated to Region',
    location: strategicWarehouse.name,
    coordinates: [strategicWarehouse.lon, strategicWarehouse.lat],
    stage: 'Stage 3',
    status: 'pending',
    timestamp: new Date().toISOString(),
    details: {
      packageId: trackingToken,
      items: standardItems,
      quantity: 60,
      beneficiaries: 1,
      distanceFromPrevious: distanceStage2to3,
      handler: `${governorate.name} Coordinator`,
    },
  };

  // ============================================================================
  // STAGE 4: Received at Village Touchpoint
  // ============================================================================
  const distanceStage3to4 = calculateDistance(
    strategicWarehouse.lon,
    strategicWarehouse.lat,
    village.lon,
    village.lat
  );

  const stage4: Waypoint = {
    id: 4,
    name: 'In Transit to Community',
    location: `${village.name} Touchpoint`,
    coordinates: [village.lon, village.lat],
    stage: 'Stage 4',
    status: 'pending',
    timestamp: new Date().toISOString(),
    details: {
      packageId: trackingToken,
      items: standardItems,
      quantity: 60,
      beneficiaries: 1,
      distanceFromPrevious: distanceStage3to4,
      handler: `${village.name} Volunteer`,
    },
  };

  // ============================================================================
  // STAGE 5: Delivered to Family
  // ============================================================================
  const distanceStage4to5 = calculateDistance(village.lon, village.lat, village.lon, village.lat); // Same location for delivery

  const stage5: Waypoint = {
    id: 5,
    name: 'Delivered',
    location: `${village.name} - ${family.profile}`,
    coordinates: [village.lon, village.lat],
    stage: 'Stage 5',
    status: 'pending',
    timestamp: new Date().toISOString(),
    details: {
      packageId: trackingToken,
      items: standardItems,
      quantity: 60,
      beneficiaries: 1,
      distanceFromPrevious: distanceStage4to5,
      handler: 'Community Field Officer',
      familyProfile: family.profile,
    },
  };

  return [stage1, stage2, stage3, stage4, stage5];
}

/**
 * Calculate total journey metadata
 */
export function calculateJourneyMetadata(waypoints: Waypoint[]) {
  const totalDistance = waypoints.reduce(
    (sum, w) => sum + (w.details.distanceFromPrevious || 0),
    0
  );

  // Estimate 1 hour per 50km + 1 hour processing per stage
  const travelHours = Math.ceil(totalDistance / 50);
  const processingHours = waypoints.length;
  const totalHours = travelHours + processingHours;

  return {
    totalDistance,
    totalDuration: `${totalHours} hours`,
    trackingToken: waypoints[0]?.details.packageId || '',
  };
}
