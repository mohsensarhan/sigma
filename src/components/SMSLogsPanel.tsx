/**
 * SMS Logs Panel
 * Displays all SMS notifications sent during journeys
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Check, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllSMS, getSMSStats, SMSMessage } from '../services/mockSMS';

export default function SMSLogsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [stats, setStats] = useState(getSMSStats());

  // Refresh SMS logs every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(getAllSMS());
      setStats(getSMSStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: SMSMessage['status']) => {
    switch (status) {
      case 'delivered':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'sent':
        return <Check className="w-4 h-4 text-cyan-500" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: SMSMessage['status']) => {
    switch (status) {
      case 'delivered': return 'rgba(0, 255, 159, 0.1)';
      case 'sent': return 'rgba(0, 217, 255, 0.1)';
      case 'queued': return 'rgba(255, 193, 7, 0.1)';
      case 'failed': return 'rgba(239, 68, 68, 0.1)';
    }
  };

  const getStatusBorderColor = (status: SMSMessage['status']) => {
    switch (status) {
      case 'delivered': return 'rgba(0, 255, 159, 0.3)';
      case 'sent': return 'rgba(0, 217, 255, 0.3)';
      case 'queued': return 'rgba(255, 193, 7, 0.3)';
      case 'failed': return 'rgba(239, 68, 68, 0.3)';
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-10">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          borderColor: 'rgba(0, 217, 255, 0.3)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <div className="text-left">
          <div className="text-sm font-semibold text-white">SMS Logs</div>
          <div className="text-xs text-cyan-400">{stats.total} sent · {stats.delivered} delivered</div>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        )}
      </motion.button>

      {/* SMS Logs Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            className="mt-3 w-96 max-h-96 overflow-y-auto rounded-2xl border backdrop-blur-md shadow-2xl"
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              borderColor: 'rgba(0, 217, 255, 0.3)',
            }}
          >
            {/* Stats Header */}
            <div className="sticky top-0 p-4 border-b backdrop-blur-md"
              style={{
                background: 'rgba(0, 0, 0, 0.95)',
                borderColor: 'rgba(0, 217, 255, 0.2)'
              }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-cyan-400 uppercase tracking-wide font-bold">
                  SMS Delivery Stats
                </div>
                <div className="text-xs text-white font-semibold">
                  {stats.deliveryRate.toFixed(0)}% delivered
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(0, 217, 255, 0.1)' }}>
                  <div className="text-cyan-400 font-semibold">{stats.queued}</div>
                  <div className="text-gray-400">Queued</div>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(0, 217, 255, 0.1)' }}>
                  <div className="text-cyan-400 font-semibold">{stats.sent}</div>
                  <div className="text-gray-400">Sent</div>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(0, 255, 159, 0.1)' }}>
                  <div className="text-green-400 font-semibold">{stats.delivered}</div>
                  <div className="text-gray-400">Delivered</div>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <div className="text-red-400 font-semibold">{stats.failed}</div>
                  <div className="text-gray-400">Failed</div>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="p-4 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No SMS messages yet
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg border"
                    style={{
                      background: getStatusColor(msg.status),
                      borderColor: getStatusBorderColor(msg.status),
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-1">{getStatusIcon(msg.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs font-mono text-gray-400">{msg.to}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-xs text-white leading-relaxed">
                          {msg.body}
                        </div>
                        {msg.journeyId && (
                          <div className="mt-1 text-xs text-cyan-400 font-mono">
                            Journey: {msg.journeyId} · Stage {msg.stage}/5
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
