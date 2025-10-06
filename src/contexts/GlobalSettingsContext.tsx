/**
 * Global Settings Context
 * Centralized state for timing control and error logging
 * Now with Supabase persistence support
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import { GlobalSettings, GlobalSettingsContextType, ErrorLog } from '../types/settings';
import { Journey } from '../types/journey';
import {
  saveJourneyToSupabase,
  updateJourneyInSupabase,
  loadJourneysFromSupabase,
} from '../services/journeyService';

const DEFAULT_STEP_DURATION = 5000; // 5 seconds

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>({
    stepDuration: DEFAULT_STEP_DURATION,
    errorLogs: [],
    activeJourneys: [],
    completedJourneys: [],
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load journeys from Supabase on mount (PRIMARY SOURCE)
  useEffect(() => {
    let mounted = true;

    async function loadFromSupabase() {
      try {
        const journeys = await loadJourneysFromSupabase();

        if (!mounted || journeys.length === 0) {return;}

        const active = journeys.filter((j) => j.status === 'active');
        const completed = journeys.filter((j) => j.status === 'completed');

        console.log(
          `📥 Loaded from Supabase - active: ${active.length}, completed: ${completed.length}`
        );

        setSettings((prev) => ({
          ...prev,
          activeJourneys: active,
          completedJourneys: completed,
        }));
      } catch (error) {
        console.error('Failed to load journeys from Supabase:', error);
      }
    }

    loadFromSupabase();

    return () => {
      mounted = false;
    };
  }, []); // Run once on mount

  // CRITICAL FIX: Use ref to always have current state for getter functions
  // This prevents stale closures when using useCallback
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
    console.log(
      `🔄 settingsRef updated - active: ${settings.activeJourneys.length}, completed: ${settings.completedJourneys.length}`
    );
  }, [settings]);

  // Debug: Log when provider mounts
  useEffect(() => {
    console.log('🟢 GlobalSettingsProvider MOUNTED');
    return () => {
      console.log('🔴 GlobalSettingsProvider UNMOUNTED - THIS SHOULD NEVER HAPPEN!');
    };
  }, []);

  // Step Duration Control
  const setStepDuration = useCallback((ms: number) => {
    if (ms < 1000 || ms > 30000) {
      console.error('Step duration must be between 1-30 seconds');
      return;
    }

    setSettings((prev) => ({
      ...prev,
      stepDuration: ms,
    }));

    console.log(`⏱️ Global step duration changed to ${ms}ms (${ms / 1000}s)`);
  }, []);

  // Error Logging
  const addErrorLog = useCallback((log: Omit<ErrorLog, 'id' | 'timestamp'>) => {
    const newLog: ErrorLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...log,
    };

    setSettings((prev) => ({
      ...prev,
      errorLogs: [newLog, ...prev.errorLogs].slice(0, 100), // Keep last 100 logs
    }));

    // Also log to console
    const emoji = log.level === 'error' ? '❌' : log.level === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${log.level.toUpperCase()}]`, log.message, log.context || '');
  }, []);

  const clearErrorLogs = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      errorLogs: [],
    }));
    console.log('🧹 Error logs cleared');
  }, []);

  const getErrorLogs = useCallback((level?: ErrorLog['level']) => {
    if (level) {
      return settingsRef.current.errorLogs.filter((log) => log.level === level);
    }
    return settingsRef.current.errorLogs;
  }, []);

  // Journey Management
  const registerJourney = useCallback(
    async (journey: Journey) => {
      console.log(`🔵 registerJourney called for: ${journey.id}`);
      console.log(
        `🔵 BEFORE registration - settingsRef.current.activeJourneys.length: ${settingsRef.current.activeJourneys.length}`
      );

      setSettings((prev) => {
        console.log(
          `🔵 INSIDE setSettings - prev.activeJourneys.length: ${prev.activeJourneys.length}`
        );

        // Check if journey already exists
        const exists = prev.activeJourneys.some((j) => j.id === journey.id);
        if (exists) {
          console.log(`🔵 Journey ${journey.id} already registered, skipping`);
          return prev;
        }

        const newActive = [...prev.activeJourneys, journey];
        console.log(`🔵 After registration, activeJourneys count: ${newActive.length}`);
        const newState = {
          ...prev,
          activeJourneys: newActive,
        };
        console.log(`🔵 Returning new state with ${newState.activeJourneys.length} journeys`);
        return newState;
      });

      console.log(
        `🔵 AFTER setSettings called - settingsRef.current.activeJourneys.length: ${settingsRef.current.activeJourneys.length}`
      );

      // CRITICAL: Wait for Supabase save to complete BEFORE returning
      // This ensures FK constraints are satisfied when donation is inserted
      try {
        await saveJourneyToSupabase(journey);
        console.log(`✅ Journey saved to Supabase: ${journey.id}`);
      } catch (error) {
        console.error('❌ Failed to save journey to Supabase:', error);
        throw error; // Propagate error to caller
      }

      addErrorLog({
        level: 'info',
        journeyId: journey.id,
        message: `Journey registered: ${journey.id}`,
        context: { type: journey.type },
      });
    },
    [addErrorLog]
  );

  const updateJourney = useCallback((id: string, updates: Partial<Journey>) => {
    setSettings((prev) => {
      const journey = prev.activeJourneys.find((j) => j.id === id);
      if (!journey) {
        console.warn(`Journey ${id} not found for update`);
        return prev;
      }

      const updatedJourney = { ...journey, ...updates };

      // Sync to Supabase (fire and forget)
      updateJourneyInSupabase(id, updates).catch((error) => {
        console.error('Failed to update journey in Supabase:', error);
      });

      // If journey completed, move to completed array
      if (updatedJourney.status === 'completed') {
        return {
          ...prev,
          activeJourneys: prev.activeJourneys.filter((j) => j.id !== id),
          completedJourneys: [...prev.completedJourneys, updatedJourney],
        };
      }

      // Otherwise update in active array
      return {
        ...prev,
        activeJourneys: prev.activeJourneys.map((j) => (j.id === id ? updatedJourney : j)),
      };
    });
  }, []);

  const removeJourney = useCallback(
    (id: string) => {
      setSettings((prev) => ({
        ...prev,
        activeJourneys: prev.activeJourneys.filter((j) => j.id !== id),
        completedJourneys: prev.completedJourneys.filter((j) => j.id !== id),
      }));

      addErrorLog({
        level: 'info',
        journeyId: id,
        message: `Journey removed: ${id}`,
      });
    },
    [addErrorLog]
  );

  const getJourney = useCallback((id: string) => {
    return (
      settingsRef.current.activeJourneys.find((j) => j.id === id) ||
      settingsRef.current.completedJourneys.find((j) => j.id === id)
    );
  }, []);

  const getAllActiveJourneys = useCallback(() => {
    console.log(`🔵 getAllActiveJourneys called:`);
    console.log(
      `   - settingsRef.current.activeJourneys.length: ${settingsRef.current.activeJourneys.length}`
    );
    console.log(`   - settings.activeJourneys.length: ${settings.activeJourneys.length}`);
    return settingsRef.current.activeJourneys;
  }, []);

  const getAllCompletedJourneys = useCallback(() => {
    return settingsRef.current.completedJourneys;
  }, []);

  const clearAllJourneys = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      activeJourneys: [],
      completedJourneys: [],
    }));

    addErrorLog({
      level: 'info',
      message: 'All journeys cleared',
    });
  }, [addErrorLog]);

  const value: GlobalSettingsContextType = {
    settings,
    setStepDuration,
    addErrorLog,
    clearErrorLogs,
    getErrorLogs,
    registerJourney,
    updateJourney,
    removeJourney,
    getJourney,
    getAllActiveJourneys,
    getAllCompletedJourneys,
    clearAllJourneys,
  };

  return <GlobalSettingsContext.Provider value={value}>{children}</GlobalSettingsContext.Provider>;
}

export function useGlobalSettings() {
  const context = useContext(GlobalSettingsContext);
  if (!context) {
    throw new Error('useGlobalSettings must be used within GlobalSettingsProvider');
  }
  return context;
}
