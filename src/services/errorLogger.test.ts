import { describe, it, expect, beforeEach } from 'vitest';
import { errorLogger, getErrorStats } from './errorLogger';

describe('errorLogger', () => {
  beforeEach(() => {
    errorLogger.clearLogs();
  });

  it('should log error messages', () => {
    errorLogger.error('Test error', { code: 500 });

    const logs = errorLogger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('error');
    expect(logs[0].message).toBe('Test error');
    expect(logs[0].context).toEqual({ code: 500 });
  });

  it('should log warning messages', () => {
    errorLogger.warn('Test warning');

    const logs = errorLogger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('warn');
  });

  it('should log info messages', () => {
    errorLogger.info('Test info');

    const logs = errorLogger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('info');
  });

  it('should include timestamp in logs', () => {
    errorLogger.error('Test');

    const logs = errorLogger.getLogs();
    expect(logs[0].timestamp).toBeDefined();
    expect(new Date(logs[0].timestamp).getTime()).toBeGreaterThan(0);
  });

  it('should clear logs', () => {
    errorLogger.error('Test 1');
    errorLogger.error('Test 2');
    expect(errorLogger.getLogs()).toHaveLength(2);

    errorLogger.clearLogs();
    expect(errorLogger.getLogs()).toHaveLength(0);
  });

  it('should get error statistics', () => {
    errorLogger.error('Error 1');
    errorLogger.error('Error 2');
    errorLogger.warn('Warning 1');
    errorLogger.info('Info 1');

    const stats = getErrorStats();
    expect(stats.total).toBe(4);
    expect(stats.errors).toBe(2);
    expect(stats.warnings).toBe(1);
    expect(stats.info).toBe(1);
  });
});