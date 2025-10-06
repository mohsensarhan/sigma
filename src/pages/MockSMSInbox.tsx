/**
 * Mock SMS Inbox
 * /sms - Displays SMS messages for each donor with clickable journey links
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ExternalLink, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { MOCK_DONORS } from '../data/mockDonors';
import { useNavigate } from 'react-router-dom';
import { getAllSMSAsync } from '../services/mockSMS';

interface SMSMessage {
  id: string;
  donorId: number;
  donorName: string;
  donorPhone: string;
  trackingId: string;
  message: string;
  timestamp: number;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  journeyLink: string;
}

export default function MockSMSInbox() {
  const [selectedDonor, setSelectedDonor] = useState<number>(1);
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load SMS messages from Supabase on mount
  useEffect(() => {
    async function loadSMSMessages() {
      try {
        console.log('📱 Loading SMS messages from Supabase...');
        const allSMSMessages = await getAllSMSAsync();
        console.log(`✅ Retrieved ${allSMSMessages.length} SMS messages from Supabase`);

        // Convert SMS messages to our interface format and enrich with donor information
        const formattedMessages: SMSMessage[] = allSMSMessages.map((sms) => {
          // Find donor by phone number
          const donor = MOCK_DONORS.find((d) => d.phone === sms.to);

          // Extract tracking ID from the message body or journeyId metadata
          const trackingId = sms.journeyId || '';

          return {
            id: sms.id,
            donorId: donor?.id || 0,
            donorName: donor?.name || 'Unknown',
            donorPhone: sms.to,
            trackingId,
            message: sms.body,
            timestamp: sms.timestamp,
            status: sms.status,
            journeyLink: `/journey/${trackingId}`,
          };
        });

        setSmsMessages(formattedMessages);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load SMS messages:', error);
        setIsLoading(false);
      }
    }

    loadSMSMessages();
  }, []);

  // Convert SMS messages to our interface format and enrich with donor information (REMOVED - now in useEffect)
  /*const smsMessages: SMSMessage[] = allSMSMessages.map(sms => {
    // Find donor by phone number
    const donor = MOCK_DONORS.find(d => d.phone === sms.to);
    
    // Extract tracking ID from the message body or journeyId metadata
    const trackingId = sms.journeyId || '';
    
    return {
      id: sms.id,
      donorId: donor?.id || 0,
      donorName: donor?.name || 'Unknown',
      donorPhone: sms.to,
      trackingId,
      message: sms.body,
      timestamp: sms.timestamp,
      status: sms.status,
      journeyLink: `/journey/${trackingId}`
    };
  });*/

  console.log(`📊 Displayed ${smsMessages.length} SMS messages`);
  console.log(
    `👤 Selected donor: ${selectedDonor}, messages: ${smsMessages.filter((msg) => msg.donorId === selectedDonor).length}`
  );

  // Filter messages for selected donor
  const selectedDonorMessages = smsMessages.filter((msg) => msg.donorId === selectedDonor);

  const getStatusIcon = (status: SMSMessage['status']) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'sent':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'queued':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: SMSMessage['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'sent':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'queued':
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
      case 'failed':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
    }
  };

  return (
    <div className="scrollable-page min-h-screen bg-gradient-to-br from-indigo-900 via-gray-900 to-black text-white p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          SMS Inbox
        </h1>
        <p className="text-gray-400">Mock SMS messages sent to donors</p>
      </motion.div>

      {/* Donor Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {MOCK_DONORS.map((donor, index) => {
            const donorMessageCount = smsMessages.filter((msg) => msg.donorId === donor.id).length;
            const isSelected = selectedDonor === donor.id;

            return (
              <motion.button
                key={donor.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedDonor(donor.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg'
                    : 'bg-black/40 border-gray-700 hover:border-indigo-500/30'
                }`}
              >
                <div className="text-4xl">{donor.avatar}</div>
                <div className="text-left">
                  <div className="font-semibold">{donor.name}</div>
                  <div className="text-sm text-gray-400">{donor.phone}</div>
                  <div className="text-xs text-indigo-400 mt-1">
                    {donorMessageCount} message{donorMessageCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* SMS Messages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-indigo-500/30"
      >
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-bold">
            Messages for {MOCK_DONORS.find((d) => d.id === selectedDonor)?.name}
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="text-lg">Loading SMS messages from Supabase...</p>
          </div>
        ) : selectedDonorMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-2">Trigger a donation to receive SMS messages</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedDonorMessages.map((sms, index) => (
              <motion.div
                key={sms.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(sms.status)}
                    <span
                      className={`text-xs font-semibold uppercase px-2 py-1 rounded border ${getStatusColor(sms.status)}`}
                    >
                      {sms.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(sms.timestamp).toLocaleString()}
                  </div>
                </div>

                <div className="text-sm text-gray-300 mb-4 leading-relaxed">{sms.message}</div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate(sms.journeyLink)}
                    className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-lg text-sm text-indigo-400 font-semibold transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Journey
                  </button>

                  <div className="text-xs text-gray-500 font-mono">{sms.trackingId}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 grid grid-cols-4 gap-4"
      >
        <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
          <div className="text-2xl font-bold text-green-400">
            {smsMessages.filter((msg) => msg.status === 'delivered').length}
          </div>
          <div className="text-sm text-gray-400">Delivered</div>
        </div>
        <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
          <div className="text-2xl font-bold text-yellow-400">
            {smsMessages.filter((msg) => msg.status === 'sent').length}
          </div>
          <div className="text-sm text-gray-400">Sent</div>
        </div>
        <div className="p-4 bg-gray-500/10 rounded-xl border border-gray-500/30">
          <div className="text-2xl font-bold text-gray-400">
            {smsMessages.filter((msg) => msg.status === 'queued').length}
          </div>
          <div className="text-sm text-gray-400">Queued</div>
        </div>
        <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
          <div className="text-2xl font-bold text-red-400">
            {smsMessages.filter((msg) => msg.status === 'failed').length}
          </div>
          <div className="text-sm text-gray-400">Failed</div>
        </div>
      </motion.div>

      {/* Nav */}
      <div className="mt-8 flex gap-4">
        <a href="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
          ← Map
        </a>
        <a href="/admin" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
          Admin
        </a>
        <a href="/donors" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
          ← Donors
        </a>
      </div>
    </div>
  );
}
