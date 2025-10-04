/**
 * TruPath V1 - Database Types
 *
 * These types mirror the future Supabase schema exactly.
 * When migrating to Supabase, only the data source changes - these types remain identical.
 */

// ============================================================================
// CORE ENTITIES
// ============================================================================

// ============================================================================
// DONOR AUTHENTICATION & PROFILES
// ============================================================================

export interface DonorProfile {
  id: string; // UUID from auth.users
  email: string;
  phone?: string;
  name?: string;
  total_donations_amount: number;
  total_donations_count: number;
  total_meals_provided: number;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: {
    name?: string;
    phone?: string;
  };
}

export interface Anchor {
  key: string;
  name: string;
  lon: number;
  lat: number;
}

export interface Governorate {
  id: string;
  name: string;
  weight: number; // For weighted random selection
  strategicWarehouse: WarehouseLocation;
}

export interface WarehouseLocation {
  name: string;
  lon: number;
  lat: number;
}

export interface Village {
  id: string;
  governorateId: string;
  name: string;
  lon: number;
  lat: number;
}

export interface Program {
  id: string;
  name: string;
  weight: number; // For weighted random selection
}

export interface Family {
  id: string;
  programId: string;
  villageId: string;
  profile: string; // e.g., "3 children, single mother, disabled woman 55"
}

// ============================================================================
// DONATION & JOURNEY
// ============================================================================

export type DonationType = 'general' | 'location-fixed' | 'program-fixed';

export interface Donation {
  id: string;
  type: DonationType;
  programId: string;
  governorateId: string;
  familyId: string;
  trackingToken: string;
  createdAt: string;
}

export type JourneyStage = 1 | 2 | 3 | 4 | 5;

export interface JourneyEvent {
  id: string;
  donationId: string;
  stage: JourneyStage;
  stageName: string;
  location: string;
  lon: number;
  lat: number;
  completedAt: string | null;
}

// ============================================================================
// SELECTION RESULTS
// ============================================================================

export interface SelectionResult {
  program: Program;
  governorate: Governorate;
  village: Village;
  family: Family;
}

// ============================================================================
// WAYPOINT (UI Model - maps to journey events)
// ============================================================================

export interface Waypoint {
  id: number;
  name: string;
  location: string;
  coordinates: [number, number];
  stage: string;
  status: 'pending' | 'active' | 'completed';
  timestamp: string;
  details: {
    packageId: string;
    items: string[];
    quantity: number;
    beneficiaries: number;
    distanceFromPrevious?: number;
    estimatedTime?: string;
    temperature?: string;
    handler: string;
  };
}
