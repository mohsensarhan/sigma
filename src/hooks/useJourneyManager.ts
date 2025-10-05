/**
 * Journey Manager Hook
 * Manages multiple concurrent donation journeys
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Journey, JourneyManagerState } from '../types/journey';
import { Waypoint } from '../data/waypoints';
import { sendJourneyNotification } from '../services/mockSMS';
import { mockAPIGateway } from '../services/mockAWSLambda';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';

interface UseJourneyManagerProps {
  onJourneyStageUpdate?: (journeyId: string, stage: number) => void;
  onJourneyComplete?: (journeyId: string) => void;
}

export function useJourneyManager({
  onJourneyStageUpdate,
  onJourneyComplete
}: UseJourneyManagerProps = {}) {
  const { settings } = useGlobalSettings();
  const [state, setState] = useState<JourneyManagerState>({
    journeys: [],
    activeCount: 0,
    completedCount: 0,
    totalCount: 0
  });

  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Start a new journey
  const startJourney = useCallback((
    journeyId: string,
    waypoints: Waypoint[],
    type: 'general' | 'location-fixed' | 'program-fixed',
    metadata: Journey['metadata']
  ) => {
    const newJourney: Journey = {
      id: journeyId,
      waypoints: waypoints.map(w => ({ ...w, status: w.id === 1 ? 'active' : 'pending' })),
      currentStage: 1,
      status: 'active',
      startedAt: Date.now(),
      type,
      metadata
    };

    setState(prev => ({
      ...prev,
      journeys: [...prev.journeys, newJourney],
      activeCount: prev.activeCount + 1,
      totalCount: prev.totalCount + 1
    }));

    // Register journey with backend
    mockAPIGateway({
      httpMethod: 'POST',
      path: '/journeys',
      body: JSON.stringify(newJourney)
    }).catch((err: Error) => console.error('[API] Failed to create journey:', err));

    // Send initial SMS (Stage 1)
    const firstWaypoint = newJourney.waypoints[0];
    if (firstWaypoint) {
      sendJourneyNotification(
        journeyId,
        1,
        '+201234567890', // Mock donor phone
        {
          location: firstWaypoint.location,
          packageId: firstWaypoint.details.packageId,
          beneficiaries: firstWaypoint.details.beneficiaries
        }
      ).catch(err => console.error('[SMS] Failed to send initial notification:', err));
    }

    // Start auto-progression for this journey
    const interval = setInterval(() => {
      setState(prevState => {
        const journey = prevState.journeys.find(j => j.id === journeyId);
        if (!journey || journey.status !== 'active') {
          clearInterval(interval);
          intervalsRef.current.delete(journeyId);
          return prevState;
        }

        const currentStage = journey.currentStage;
        const nextStage = currentStage + 1;

        // Update waypoints: current → completed, next → active
        const updatedWaypoints = journey.waypoints.map(w => {
          if (w.id === currentStage) return { ...w, status: 'completed' as const };
          if (w.id === nextStage) return { ...w, status: 'active' as const };
          return w;
        });

        // Check if journey is complete
        if (nextStage > 5) {
          clearInterval(interval);
          intervalsRef.current.delete(journeyId);

          const completedJourney: Journey = {
            ...journey,
            waypoints: updatedWaypoints,
            currentStage: 5,
            status: 'completed',
            completedAt: Date.now()
          };

          onJourneyComplete?.(journeyId);

          return {
            ...prevState,
            journeys: prevState.journeys.map(j =>
              j.id === journeyId ? completedJourney : j
            ),
            activeCount: prevState.activeCount - 1,
            completedCount: prevState.completedCount + 1
          };
        }

        // Progress to next stage
        const updatedJourney: Journey = {
          ...journey,
          waypoints: updatedWaypoints,
          currentStage: nextStage
        };

        // Send SMS notification for this stage
        const waypoint = updatedWaypoints.find(w => w.id === nextStage);
        if (waypoint) {
          sendJourneyNotification(
            journeyId,
            nextStage,
            '+201234567890', // Mock donor phone
            {
              location: waypoint.location,
              packageId: waypoint.details.packageId,
              beneficiaries: waypoint.details.beneficiaries
            }
          ).catch(err => console.error('[SMS] Failed:', err));
        }

        // Call API to update journey in backend
        mockAPIGateway({
          httpMethod: 'PUT',
          path: `/journeys/${journeyId}/stage`,
          body: JSON.stringify({ stage: nextStage })
        }).catch((err: Error) => console.error('[API] Failed:', err));

        onJourneyStageUpdate?.(journeyId, nextStage);

        return {
          ...prevState,
          journeys: prevState.journeys.map(j =>
            j.id === journeyId ? updatedJourney : j
          )
        };
      });
    }, settings.stepDuration);

    intervalsRef.current.set(journeyId, interval);

    return journeyId;
  }, [onJourneyStageUpdate, onJourneyComplete, settings.stepDuration]);

  // Stop/pause a journey
  const pauseJourney = useCallback((journeyId: string) => {
    const interval = intervalsRef.current.get(journeyId);
    if (interval) {
      clearInterval(interval);
      intervalsRef.current.delete(journeyId);
    }

    setState(prev => ({
      ...prev,
      journeys: prev.journeys.map(j =>
        j.id === journeyId ? { ...j, status: 'paused' as const } : j
      ),
      activeCount: prev.activeCount - 1
    }));
  }, []);

  // Remove a journey
  const removeJourney = useCallback((journeyId: string) => {
    const interval = intervalsRef.current.get(journeyId);
    if (interval) {
      clearInterval(interval);
      intervalsRef.current.delete(journeyId);
    }

    setState(prev => {
      const journey = prev.journeys.find(j => j.id === journeyId);
      const wasActive = journey?.status === 'active';

      return {
        ...prev,
        journeys: prev.journeys.filter(j => j.id !== journeyId),
        activeCount: wasActive ? prev.activeCount - 1 : prev.activeCount,
        totalCount: prev.totalCount - 1
      };
    });
  }, []);

  // Clear all journeys
  const clearAllJourneys = useCallback(() => {
    // Clear all intervals
    intervalsRef.current.forEach(interval => clearInterval(interval));
    intervalsRef.current.clear();

    setState({
      journeys: [],
      activeCount: 0,
      completedCount: 0,
      totalCount: 0
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();
    };
  }, []);

  // Get specific journey
  const getJourney = useCallback((journeyId: string) => {
    return state.journeys.find(j => j.id === journeyId);
  }, [state.journeys]);

  // Get all waypoints for map display (merged from all journeys)
  const getAllWaypoints = useCallback(() => {
    const waypointMap = new Map<string, Waypoint>();

    state.journeys.forEach(journey => {
      journey.waypoints.forEach(waypoint => {
        const key = `${waypoint.coordinates[0]},${waypoint.coordinates[1]}`;

        // If waypoint already exists, keep the most "advanced" status
        const existing = waypointMap.get(key);
        if (!existing) {
          waypointMap.set(key, { ...waypoint, journeyId: journey.id });
        } else {
          const statusPriority = { completed: 3, active: 2, pending: 1 };
          if (statusPriority[waypoint.status] > statusPriority[existing.status]) {
            waypointMap.set(key, { ...waypoint, journeyId: journey.id });
          }
        }
      });
    });

    return Array.from(waypointMap.values());
  }, [state.journeys]);

  return {
    state,
    startJourney,
    pauseJourney,
    removeJourney,
    clearAllJourneys,
    getJourney,
    getAllWaypoints
  };
}
