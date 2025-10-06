/**
 * Admin Dashboard
 * /admin - Global controls, error logs, journey monitoring
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gauge, AlertTriangle, CheckCircle, Download, Trash2, Activity } from 'lucide-react';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';
import { downloadErrorLogs, getErrorStats } from '../services/errorLogger';

export default function AdminDashboard() {
  const {
    settings,
    setStepDuration,
    clearErrorLogs,
    getErrorLogs,
    getAllActiveJourneys,
    getAllCompletedJourneys,
    clearAllJourneys,
  } = useGlobalSettings();

  const [stepDurationInput, setStepDurationInput] = useState(settings.stepDuration / 1000);
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const activeJourneys = getAllActiveJourneys();
  const completedJourneys = getAllCompletedJourneys();
  const errorLogs = filterLevel === 'all' ? getErrorLogs() : getErrorLogs(filterLevel);
  const errorStats = getErrorStats();

  const handleStepDurationChange = (value: number) => {
    setStepDurationInput(value);
    setStepDuration(value * 1000);
  };

  return (
    <div className="scrollable-page min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-gray-400">Global controls and system monitoring</p>
      </motion.div>

      {/* Global Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-cyan-500/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <Gauge className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold">Global Controls</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step Duration Control */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Step Duration: {stepDurationInput}s
            </label>
            <input
              type="range"
              min="1"
              max="30"
              value={stepDurationInput}
              onChange={(e) => handleStepDurationChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1s</span>
              <span>15s</span>
              <span>30s</span>
            </div>
          </div>

          {/* Clear All Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                if (confirm('Clear all journeys and reset system?')) {
                  clearAllJourneys();
                }
              }}
              className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-400 font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Clear All Journeys
            </button>
          </div>
        </div>
      </motion.div>

      {/* Journey Monitor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-cyan-500/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold">Journey Monitor</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
            <div className="text-3xl font-bold text-green-400">{activeJourneys.length}</div>
            <div className="text-sm text-gray-400">Active Journeys</div>
          </div>
          <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
            <div className="text-3xl font-bold text-cyan-400">{completedJourneys.length}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
            <div className="text-3xl font-bold text-purple-400">
              {activeJourneys.length + completedJourneys.length}
            </div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
        </div>

        {/* Active Journeys List */}
        {activeJourneys.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Active Journeys:</h3>
            {activeJourneys.map((journey) => (
              <div
                key={journey.id}
                className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-mono text-sm">{journey.id}</span>
                </div>
                <div className="text-sm text-gray-400">Stage {journey.currentStage}/5</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Error Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-cyan-500/30"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold">Error Logs</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm"
            >
              <option value="all">All ({errorStats.total})</option>
              <option value="error">Errors ({errorStats.errors})</option>
              <option value="warning">Warnings ({errorStats.warnings})</option>
              <option value="info">Info ({errorStats.info})</option>
            </select>

            {/* Download */}
            <button
              onClick={downloadErrorLogs}
              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-sm text-cyan-400 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>

            {/* Clear */}
            <button
              onClick={clearErrorLogs}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm text-red-400 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Error Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-2 bg-gray-800/50 rounded-lg text-center">
            <div className="text-lg font-bold text-white">{errorStats.total}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="p-2 bg-red-500/10 rounded-lg text-center border border-red-500/30">
            <div className="text-lg font-bold text-red-400">{errorStats.errors}</div>
            <div className="text-xs text-gray-400">Errors</div>
          </div>
          <div className="p-2 bg-yellow-500/10 rounded-lg text-center border border-yellow-500/30">
            <div className="text-lg font-bold text-yellow-400">{errorStats.warnings}</div>
            <div className="text-xs text-gray-400">Warnings</div>
          </div>
          <div className="p-2 bg-blue-500/10 rounded-lg text-center border border-blue-500/30">
            <div className="text-lg font-bold text-blue-400">{errorStats.info}</div>
            <div className="text-xs text-gray-400">Info</div>
          </div>
        </div>

        {/* Logs List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {errorLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No logs yet</p>
            </div>
          ) : (
            errorLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border ${
                  log.level === 'error'
                    ? 'bg-red-500/10 border-red-500/30'
                    : log.level === 'warning'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold uppercase ${
                        log.level === 'error'
                          ? 'text-red-400'
                          : log.level === 'warning'
                            ? 'text-yellow-400'
                            : 'text-blue-400'
                      }`}
                    >
                      {log.level}
                    </span>
                    {log.journeyId && (
                      <span className="text-xs font-mono text-gray-400">{log.journeyId}</span>
                    )}
                    {log.stage && (
                      <span className="text-xs text-gray-500">Stage {log.stage}/5</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-white">{log.message}</p>
                {log.context && (
                  <pre className="text-xs text-gray-400 mt-1 overflow-x-auto">
                    {JSON.stringify(log.context, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Quick Nav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 flex gap-4"
      >
        <Link
          to="/"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
        >
          ← Map
        </Link>
        <Link
          to="/donors"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
        >
          Donors →
        </Link>
        <Link
          to="/sms"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
        >
          SMS →
        </Link>
      </motion.div>
    </div>
  );
}
