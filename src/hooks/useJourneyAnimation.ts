/**
 * TruPath V1 - Journey Animation Hook
 *
 * Handles auto-progression through 5 stages with 5-second intervals.
 * Updates waypoint status: pending → active → completed
 */

import { useEffect, useRef } from 'react';
import type { Waypoint } from '../data/waypoints';

const STAGE_DURATION_MS = 5000; // 5 seconds per stage

interface UseJourneyAnimationProps {
  waypoints: Waypoint[];
  setWaypoints: (waypoints: Waypoint[] | ((prev: Waypoint[]) => Waypoint[])) => void;
  onStageComplete?: (completedStageId: number, updatedWaypoints: Waypoint[]) => void;
  onJourneyComplete?: () => void;
}

export function useJourneyAnimation({
  waypoints,
  setWaypoints,
  onStageComplete,
  onJourneyComplete,
}: UseJourneyAnimationProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasActiveRef = useRef(false);

  useEffect(() => {
    // Check if there's an active waypoint
    const activeWaypoint = waypoints.find((w) => w.status === 'active');
    const hasActive = !!activeWaypoint;

    // Only start interval when transitioning from no-active to has-active
    if (hasActive && !hasActiveRef.current) {
      hasActiveRef.current = true;

      // Clear any existing interval before starting new one
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Start progression timer
      intervalRef.current = setInterval(() => {
        setWaypoints((prevWaypoints: Waypoint[]) => {
          const activeWaypoint = prevWaypoints.find((w: Waypoint) => w.status === 'active');

          if (!activeWaypoint) {
            // No active waypoint - journey might be complete
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            hasActiveRef.current = false;
            return prevWaypoints;
          }

          const currentId = activeWaypoint.id;

          // Mark current stage as completed
          const updated = prevWaypoints.map((w: Waypoint) => {
            if (w.id === currentId) {
              return { ...w, status: 'completed' as const };
            }
            return w;
          });

          // Check if this was the last stage
          if (currentId === 5) {
            // Journey complete! Call callback before returning
            if (onStageComplete) {
              onStageComplete(currentId, updated);
            }

            // Stop interval
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            hasActiveRef.current = false;

            if (onJourneyComplete) {
              setTimeout(onJourneyComplete, 500);
            }

            return updated;
          }

          // Move to next stage
          const nextId = currentId + 1;
          const finalWaypoints = updated.map((w: Waypoint) => {
            if (w.id === nextId) {
              return { ...w, status: 'active' as const };
            }
            return w;
          });

          // Call completion callback with updated waypoints
          if (onStageComplete) {
            onStageComplete(currentId, finalWaypoints);
          }

          return finalWaypoints;
        });
      }, STAGE_DURATION_MS);
    } else if (!hasActive && hasActiveRef.current) {
      // Waypoints cleared - reset
      hasActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypoints.length, waypoints.find(w => w.status === 'active') ? 'has-active' : 'no-active']); // Only re-run when journey starts/stops

  // Function to manually start a journey
  const startJourney = () => {
    setWaypoints((prevWaypoints) =>
      prevWaypoints.map((w) => (w.id === 1 ? { ...w, status: 'active' as const } : w))
    );
  };

  return { startJourney };
}
