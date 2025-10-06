/**
 * Global Journey Progression Hook
 * Auto-progresses journeys registered in GlobalSettingsContext
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';
import { sendJourneyNotification } from '../services/mockSMS';

export function useGlobalJourneyProgression() {
  const { settings, getAllActiveJourneys, updateJourney, addErrorLog } = useGlobalSettings();
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const processedJourneysRef = useRef<Set<string>>(new Set());

  // Create a stable progression function that doesn't change on every render
  const progressJourney = useCallback(
    (journeyId: string) => {
      const currentJourney = getAllActiveJourneys().find((j) => j.id === journeyId);
      if (!currentJourney || currentJourney.status !== 'active') {
        const existingInterval = intervalsRef.current.get(journeyId);
        if (existingInterval) {
          clearInterval(existingInterval);
          intervalsRef.current.delete(journeyId);
          console.log(`⏹️ Stopped progression for inactive journey: ${journeyId}`);
        }
        return;
      }

      const nextStage = currentJourney.currentStage + 1;

      // Update waypoints: current → completed, next → active
      const updatedWaypoints = currentJourney.waypoints.map((w) => {
        if (w.id === currentJourney.currentStage) {return { ...w, status: 'completed' as const };}
        if (w.id === nextStage) {return { ...w, status: 'active' as const };}
        return w;
      });

      // Check if journey is complete (all 5 stages done)
      if (nextStage > 5) {
        const existingInterval = intervalsRef.current.get(journeyId);
        if (existingInterval) {
          clearInterval(existingInterval);
          intervalsRef.current.delete(journeyId);
        }

        updateJourney(journeyId, {
          waypoints: updatedWaypoints,
          currentStage: 5,
          status: 'completed',
          completedAt: Date.now(),
        });

        addErrorLog({
          level: 'info',
          journeyId: journeyId,
          message: `Journey completed: ${journeyId}`,
          stage: 5,
        });

        console.log(`✅ Journey ${journeyId} COMPLETED`);
        return;
      }

      // Progress to next stage
      updateJourney(journeyId, {
        waypoints: updatedWaypoints,
        currentStage: nextStage,
      });

      addErrorLog({
        level: 'info',
        journeyId: journeyId,
        message: `Journey progressed to Stage ${nextStage}/5`,
        stage: nextStage,
      });

      console.log(`🚀 Journey ${journeyId} → Stage ${nextStage}/5`);

      // Send SMS notification for the new stage
      const newWaypoint = updatedWaypoints.find((w) => w.id === nextStage);
      if (newWaypoint && currentJourney.metadata.donorPhone) {
        sendJourneyNotification(journeyId, nextStage, currentJourney.metadata.donorPhone, {
          location: newWaypoint.location,
          packageId: newWaypoint.details.packageId,
          beneficiaries: newWaypoint.details.beneficiaries,
        })
          .then((sms) => {
            console.log(`📱 SMS sent for Stage ${nextStage}: ${sms.id}`);
            addErrorLog({
              level: 'info',
              journeyId: journeyId,
              message: `SMS sent for Stage ${nextStage}`,
              stage: nextStage,
              context: { smsId: sms.id },
            });
          })
          .catch((error) => {
            console.error(`❌ Failed to send SMS for Stage ${nextStage}:`, error);
            addErrorLog({
              level: 'error',
              journeyId: journeyId,
              message: `Failed to send SMS for Stage ${nextStage}: ${error.message}`,
              stage: nextStage,
            });
          });
      }
    },
    [getAllActiveJourneys, updateJourney, addErrorLog]
  );

  // Main effect to manage intervals
  useEffect(() => {
    const activeJourneys = getAllActiveJourneys();
    console.log(`🔍 Checking ${activeJourneys.length} active journeys for progression`);

    // Start intervals for new journeys
    activeJourneys.forEach((journey) => {
      if (!intervalsRef.current.has(journey.id)) {
        console.log(
          `▶️ Starting progression for new journey: ${journey.id} (Stage ${journey.currentStage})`
        );

        const interval = setInterval(() => {
          progressJourney(journey.id);
        }, settings.stepDuration);

        intervalsRef.current.set(journey.id, interval);
      }
    });

    // Cleanup intervals for removed journeys
    const activeJourneyIds = new Set(activeJourneys.map((j) => j.id));
    Array.from(intervalsRef.current.keys()).forEach((journeyId) => {
      if (!activeJourneyIds.has(journeyId)) {
        const interval = intervalsRef.current.get(journeyId);
        if (interval) {
          clearInterval(interval);
          intervalsRef.current.delete(journeyId);
          console.log(`⏹️ Stopped progression for removed journey: ${journeyId}`);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      intervalsRef.current.forEach((interval) => clearInterval(interval));
      intervalsRef.current.clear();
    };
  }, [settings.stepDuration, progressJourney]);

  // Separate effect to poll for new journeys
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const activeJourneys = getAllActiveJourneys();

      // Start intervals for newly added journeys
      activeJourneys.forEach((journey) => {
        if (!intervalsRef.current.has(journey.id)) {
          console.log(
            `▶️ [Poll] Starting progression for new journey: ${journey.id} (Stage ${journey.currentStage})`
          );

          const interval = setInterval(() => {
            progressJourney(journey.id);
          }, settings.stepDuration);

          intervalsRef.current.set(journey.id, interval);
        }
      });
    }, 1000); // Check every second for new journeys

    return () => clearInterval(checkInterval);
  }, [getAllActiveJourneys, settings.stepDuration, progressJourney]);

  // Log active intervals for debugging
  useEffect(() => {
    const intervalCount = intervalsRef.current.size;
    if (intervalCount > 0) {
      console.log(`📊 Currently managing ${intervalCount} journey progression intervals`);
    }
  });
}
