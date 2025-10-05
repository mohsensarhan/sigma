/**
 * Error Logger Service
 * Utility functions for structured error logging
 */

import { ErrorLog } from '../types/settings';

// Error log storage (in-memory for now, could be persisted later)
let errorLogs: ErrorLog[] = [];

/**
 * Log an error with context
 */
export function logError(log: Omit<ErrorLog, 'id' | 'timestamp'>): ErrorLog {
  const newLog: ErrorLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    ...log
  };

  errorLogs.unshift(newLog); // Add to beginning
  errorLogs = errorLogs.slice(0, 100); // Keep last 100

  // Console output with emoji
  const emoji = log.level === 'error' ? '❌' : log.level === 'warning' ? '⚠️' : 'ℹ️';
  const journeyInfo = log.journeyId ? `[Journey: ${log.journeyId}]` : '';
  const stageInfo = log.stage ? `[Stage ${log.stage}/5]` : '';

  console.log(`${emoji} ${journeyInfo}${stageInfo} ${log.message}`, log.context || '');

  return newLog;
}

/**
 * Log an info message
 */
export function logInfo(message: string, context?: any, journeyId?: string, stage?: number): ErrorLog {
  return logError({
    level: 'info',
    message,
    context,
    journeyId,
    stage
  });
}

/**
 * Log a warning
 */
export function logWarning(message: string, context?: any, journeyId?: string, stage?: number): ErrorLog {
  return logError({
    level: 'warning',
    message,
    context,
    journeyId,
    stage
  });
}

/**
 * Log a critical error
 */
export function logCritical(
  message: string,
  error?: Error,
  context?: any,
  journeyId?: string,
  stage?: number
): ErrorLog {
  return logError({
    level: 'error',
    message,
    stack: error?.stack,
    context: {
      ...context,
      errorMessage: error?.message,
      errorName: error?.name
    },
    journeyId,
    stage
  });
}

/**
 * Get all error logs
 */
export function getErrorLogs(): ErrorLog[] {
  return [...errorLogs];
}

/**
 * Get error logs filtered by level
 */
export function getErrorLogsByLevel(level: ErrorLog['level']): ErrorLog[] {
  return errorLogs.filter(log => log.level === level);
}

/**
 * Get error logs for a specific journey
 */
export function getErrorLogsByJourney(journeyId: string): ErrorLog[] {
  return errorLogs.filter(log => log.journeyId === journeyId);
}

/**
 * Clear all error logs
 */
export function clearErrorLogs(): void {
  errorLogs = [];
  console.log('🧹 Error logs cleared');
}

/**
 * Export error logs as CSV
 */
export function exportErrorLogsAsCSV(): string {
  const headers = ['Timestamp', 'Level', 'Journey ID', 'Stage', 'Message', 'Context'];
  const rows = errorLogs.map(log => [
    new Date(log.timestamp).toISOString(),
    log.level,
    log.journeyId || '',
    log.stage?.toString() || '',
    log.message,
    JSON.stringify(log.context || {})
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Download error logs as CSV file
 */
export function downloadErrorLogs(): void {
  const csv = exportErrorLogsAsCSV();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `error-logs-${Date.now()}.csv`;
  link.click();

  URL.revokeObjectURL(url);
  console.log('📥 Error logs downloaded');
}

/**
 * Get error statistics
 */
export function getErrorStats() {
  const total = errorLogs.length;
  const errors = errorLogs.filter(log => log.level === 'error').length;
  const warnings = errorLogs.filter(log => log.level === 'warning').length;
  const info = errorLogs.filter(log => log.level === 'info').length;

  return {
    total,
    errors,
    warnings,
    info,
    errorRate: total > 0 ? (errors / total) * 100 : 0
  };
}
