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
    program?: string;
    familyId?: string;
    familyProfile?: string;
  };
}

export interface JourneyManagerState {
  journeys: Journey[];
  activeCount: number;
  completedCount: number;
  totalCount: number;
}
