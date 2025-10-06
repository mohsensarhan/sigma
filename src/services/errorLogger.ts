interface ErrorLog {
  level: 'error' | 'warn' | 'info';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];

  log(entry: Omit<ErrorLog, 'timestamp' | 'userAgent' | 'url'>) {
    const logEntry: ErrorLog = {
      ...entry,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.logs.push(logEntry);

    // Console log in development
    if (import.meta.env.DEV) {
      console[entry.level](entry.message, entry.context);
    }

    // TODO: In production, send to error tracking service
    // this.sendToSentry(logEntry);
    // this.sendToSupabase(logEntry);
  }

  error(message: string, context?: Record<string, any>) {
    this.log({ level: 'error', message, context });
  }

  warn(message: string, context?: Record<string, any>) {
    this.log({ level: 'warn', message, context });
  }

  info(message: string, context?: Record<string, any>) {
    this.log({ level: 'info', message, context });
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const errorLogger = new ErrorLogger();

// Legacy functions for backward compatibility with AdminDashboard
export function getErrorStats() {
  const logs = errorLogger.getLogs();
  const total = logs.length;
  const errors = logs.filter((log) => log.level === 'error').length;
  const warnings = logs.filter((log) => log.level === 'warn').length;
  const info = logs.filter((log) => log.level === 'info').length;

  return {
    total,
    errors,
    warnings,
    info,
    errorRate: total > 0 ? (errors / total) * 100 : 0,
  };
}

export function downloadErrorLogs(): void {
  const logs = errorLogger.getLogs();
  const headers = ['Timestamp', 'Level', 'Message', 'Context'];
  const rows = logs.map((log) => [
    log.timestamp,
    log.level,
    log.message,
    JSON.stringify(log.context || {}),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `error-logs-${Date.now()}.csv`;
  link.click();

  URL.revokeObjectURL(url);
  console.log('📥 Error logs downloaded');
}