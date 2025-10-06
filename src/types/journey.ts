/**
 * Multi-Journey Management Types
 * Supports concurrent donation tracking
 */

import { Waypoint } from '../data/waypoints';

export interface Journey {
  id: string; // Donation ID (tracking token)
  waypoints: Waypoint[];
  currentStage: number; // 1-5
  status: 'active' | 'completed' | 'paused';
  startedAt: number; // timestamp
  completedAt?: number; // timestamp
  type: 'general' | 'location-fixed' | 'program-fixed';
  metadata: {
    governorate?: string;
    governorateId?: string;
    program?: string;
    programId?: string;
    familyId?: string;
    familyProfile?: string;
    donorId?: string;
    donorName?: string;
    donorPhone?: string;
    donorEmail?: string;
    amount?: number;
  };
}

export interface JourneyManagerState {
  journeys: Journey[];
  activeCount: number;
  completedCount: number;
  totalCount: number;
}
