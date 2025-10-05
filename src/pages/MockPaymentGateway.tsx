/**
 * Mock Payment Gateway
 * /donors - Simulate donor donations
 * NOW WRITES TO SUPABASE AS PRIMARY SOURCE
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CreditCard, Zap, Users, CheckCircle } from 'lucide-react';
import { MOCK_DONORS } from '../data/mockDonors';
import { selectBeneficiary } from '../data/selectionAlgorithm';
import { generateJourney } from '../data/journeyGenerator';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';
import { useNavigate } from 'react-router-dom';
import { sendSMS } from '../services/mockSMS';
import { supabase } from '../supabaseClient';

export default function MockPaymentGateway() {
  const [amounts, setAmounts] = useState<Record<number, number>>(
    Object.fromEntries(MOCK_DONORS.map((d) => [d.id, d.defaultAmount]))
  );
  const [processing, setProcessing] = useState<number | null>(null);
  const [justDonated, setJustDonated] = useState<Record<number, string | null>>({});
  const [donationHistory, setDonationHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [donorStats, setDonorStats] = useState<Record<number, { total: number; count: number }>>({});
  const { registerJourney, addErrorLog } = useGlobalSettings();
  const navigate = useNavigate();

  // Load donation history from Supabase on mount
  useEffect(() => {
    async function loadDonationHistory() {
      try {
        console.log('💰 Loading donation history from Supabase...');
        const { data, error } = await supabase
          .from('donations')
          .select(
            `
            *,
            journeys (
              id,
              donor_name,
              donor_phone
            )
          `
          )
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {throw error;}

        const formattedHistory = (data || []).map((d) => ({
          donorName: d.journeys?.donor_name || 'Unknown',
          amount: parseFloat(d.amount),
          trackingId: d.journey_id || 'N/A',
          timestamp: new Date(d.created_at).getTime(),
          status: d.status,
        }));

        setDonationHistory(formattedHistory);
        console.log(`✅ Loaded ${formattedHistory.length} donations from Supabase`);
        setIsLoadingHistory(false);
      } catch (error) {
        console.error('Failed to load donation history:', error);
        setIsLoadingHistory(false);
      }
    }

    loadDonationHistory();
  }, []);

  const handleDonate = async (donorId: number) => {
    console.log(`🔘 DONATE button clicked for donor ID: ${donorId}`);
    setProcessing(donorId);
    const donor = MOCK_DONORS.find((d) => d.id === donorId)!;
    const amount = amounts[donorId];
    console.log(`💰 Processing donation: ${donor.name} - ${amount}`);

    try {
      // Select beneficiary
      const selection = await selectBeneficiary('general');

      // Generate journey
      const journeyWaypoints = generateJourney(selection);
      const trackingId = journeyWaypoints[0].details.packageId;

      // SMS will be sent after journey registration to avoid FK errors

      // Register journey in global context
      const journey = {
        id: trackingId,
        waypoints: journeyWaypoints.map((w) => ({
          ...w,
          status: w.id === 1 ? ('active' as const) : ('pending' as const),
        })),
        currentStage: 1,
        status: 'active' as const,
        startedAt: Date.now(),
        type: 'general' as const,
        metadata: {
          governorate: selection.governorate.name,
          governorateId: selection.governorate.id,
          program: selection.program.name,
          programId: selection.program.id,
          familyId: selection.family.id,
          familyProfile: selection.family.profile,
          donorName: donor.name,
          donorPhone: donor.phone,
          amount,
        },
      };

      // CRITICAL: Await journey registration to ensure it's saved to Supabase
      // BEFORE we try to insert donation (FK constraint requirement)
      await registerJourney(journey);

      // Write donation to Supabase AFTER journey is saved to Supabase
      try {
        const { error: donationError } = await supabase.from('donations').insert({
          journey_id: trackingId,
          donor_id: null, // No auth.users ID for mock donors
          amount,
          currency: 'USD',
          payment_method: 'mock',
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

        if (donationError) {
          console.error('Failed to write donation to Supabase:', donationError);
        } else {
          console.log(`✅ Donation saved to Supabase for journey: ${trackingId}`);
        }
      } catch (error) {
        console.error('Error writing donation to Supabase:', error);
      }

      addErrorLog({
        level: 'info',
        message: `Donation received: ${donor.name} donated ${amount}`,
        journeyId: trackingId,
        context: { amount, donor: donor.name },
      });

      // Send SMS notification AFTER journey is registered
      const getOrigin = () => {
        if (typeof window !== 'undefined' && window.location) {
          return window.location.origin;
        }
        return 'http://localhost:5173'; // Default for testing
      };
      const smsMessage = `Thank you ${donor.name}! Your donation of ${amount} has been received. Track your journey here: ${getOrigin()}/journey/${trackingId}`;
      console.log(`📱 Sending SMS to ${donor.phone}: ${smsMessage}`);
      const sentSMS = await sendSMS(donor.phone, smsMessage, { journeyId: trackingId });
      console.log(`✅ SMS sent with ID: ${sentSMS.id}`);

      // Update donor stats
      setDonorStats(prev => ({
        ...prev,
        [donorId]: {
          total: (prev[donorId]?.total || 0) + amount,
          count: (prev[donorId]?.count || 0) + 1
        }
      }));
      console.log(`📊 Updated stats for donor ${donorId}`);

      // Reload donation history after successful donation
      const { data, error } = await supabase
        .from('donations')
        .select(
          `
          *,
          journeys (
            id,
            donor_name,
            donor_phone
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        const formattedHistory = data.map((d) => ({
          donorName: d.journeys?.donor_name || 'Unknown',
          amount: parseFloat(d.amount),
          trackingId: d.journey_id || 'N/A',
          timestamp: new Date(d.created_at).getTime(),
          status: d.status,
        }));
        setDonationHistory(formattedHistory);
        console.log(`✅ Donation history reloaded: ${formattedHistory.length} donations`);
      }

      // Visual feedback - show success state
      setProcessing(null);
      setJustDonated({ ...justDonated, [donorId]: trackingId });
      console.log(`✅ Donation complete for ${donor.name}`);

      // Clear success state after 5 seconds
      setTimeout(() => {
        setJustDonated(prev => ({ ...prev, [donorId]: null }));
      }, 5000);
    } catch (error: any) {
      addErrorLog({
        level: 'error',
        message: `Donation failed: ${error.message}`,
        context: { donor: donor.name, amount },
      });
      setProcessing(null);
    }
  };

  const handleTriggerAll = async () => {
    for (const donor of MOCK_DONORS) {
      await handleDonate(donor.id);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const handleRandomDonor = () => {
    const randomDonor = MOCK_DONORS[Math.floor(Math.random() * MOCK_DONORS.length)];
    handleDonate(randomDonor.id);
  };

  return (
    <div className="scrollable-page min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black text-white p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Mock Payment Gateway
        </h1>
        <p className="text-gray-400">Simulate donor donations</p>
      </motion.div>

      {/* Bulk Actions */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={handleTriggerAll}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold transition-all flex items-center gap-2"
        >
          <Zap className="w-5 h-5" />
          Trigger All Donors
        </button>
        <button
          onClick={handleRandomDonor}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all flex items-center gap-2"
        >
          <Users className="w-5 h-5" />
          Random Donor
        </button>
      </div>

      {/* Donor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {MOCK_DONORS.map((donor, index) => (
          <motion.div
            key={donor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-purple-500/30"
          >
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">{donor.avatar}</div>
              <h3 className="text-xl font-bold">{donor.name}</h3>
              <p className="text-sm text-gray-400">{donor.phone}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Amount ($)</label>
              <input
                type="number"
                value={amounts[donor.id]}
                onChange={(e) => setAmounts({ ...amounts, [donor.id]: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                min="1"
                step="5"
              />
            </div>

            <button
              onClick={() => handleDonate(donor.id)}
              disabled={processing === donor.id || !!justDonated[donor.id]}
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                processing === donor.id
                  ? 'bg-gray-700 cursor-not-allowed'
                  : justDonated[donor.id]
                    ? 'bg-green-600 cursor-default'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              }`}
            >
              {processing === donor.id ? (
                <>
                  <CreditCard className="w-5 h-5 animate-pulse" />
                  Processing...
                </>
              ) : justDonated[donor.id] ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Donated!
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  DONATE
                </>
              )}
            </button>

            {justDonated[donor.id] && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/journey/${justDonated[donor.id]}`)}
                className="mt-2 w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-sm text-cyan-400 transition-all"
              >
                Track Journey →
              </motion.button>
            )}

            <div className="mt-3 text-center text-sm text-gray-500">
              Total: ${donorStats[donor.id]?.total || 0} ({donorStats[donor.id]?.count || 0} donations)
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Donations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-purple-500/30"
      >
        <h2 className="text-xl font-bold mb-4">Recent Donations from Supabase</h2>
        {isLoadingHistory ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-pulse">Loading donation history...</div>
          </div>
        ) : donationHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No donations yet</div>
        ) : (
          <div className="space-y-2">
            {donationHistory.map((donation, i) => (
              <div
                key={i}
                className="p-3 bg-gray-800/50 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      donation.status === 'completed'
                        ? 'bg-green-500'
                        : donation.status === 'processing'
                          ? 'bg-yellow-500'
                          : 'bg-gray-500'
                    }`}
                  />
                  <span className="font-semibold">{donation.donorName}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-400">${donation.amount}</span>
                </div>
                <button
                  onClick={() => navigate(`/journey/${donation.trackingId}`)}
                  className="font-mono text-sm text-purple-400 hover:text-purple-300"
                >
                  {donation.trackingId}
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Nav */}
      <div className="mt-8 flex gap-4">
        <Link to="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
          ← Map
        </Link>
        <Link to="/admin" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
          Admin
        </Link>
        <Link to="/sms" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
          SMS →
        </Link>
      </div>
    </div>
  );
}
