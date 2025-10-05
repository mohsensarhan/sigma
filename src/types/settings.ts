/**
 * Global Settings Types
 * Centralized configuration and error logging
 */

import { Journey } from './journey';

export interface ErrorLog {
  id: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  journeyId?: string;
  stage?: number;
  message: string;
  stack?: string;
  context?: any;
}

export interface GlobalSettings {
  stepDuration: number; // milliseconds (default: 5000)
  errorLogs: ErrorLog[];
  activeJourneys: Journey[];
  completedJourneys: Journey[];
}

export interface GlobalSettingsContextType {
  settings: GlobalSettings;

  // Step Duration Control
  setStepDuration: (ms: number) => void;

  // Error Logging
  addErrorLog: (log: Omit<ErrorLog, 'id' | 'timestamp'>) => void;
  clearErrorLogs: () => void;
  getErrorLogs: (level?: ErrorLog['level']) => ErrorLog[];

  // Journey Management
  registerJourney: (journey: Journey) => void;
  updateJourney: (id: string, updates: Partial<Journey>) => void;
  removeJourney: (id: string) => void;
  getJourney: (id: string) => Journey | undefined;
  getAllActiveJourneys: () => Journey[];
  getAllCompletedJourneys: () => Journey[];
  clearAllJourneys: () => void;
}
