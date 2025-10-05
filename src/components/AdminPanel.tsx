/**
 * TruPath V1 - Admin Panel
 *
 * Hidden panel for testing donation triggers.
 * Slides out from the left side of the screen.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Dices, MapPin, Package } from 'lucide-react';
import { getAllGovernorates, getAllPrograms } from '../data/dataService';
import type { DonationType, Governorate, Program } from '../types/database';

interface AdminPanelProps {
  onTriggerDonation: (type: DonationType, fixedId?: string) => void;
  onClearSystem: () => void;
  activeDonation: { id: string; stage: number } | null;
}

export default function AdminPanel({ onTriggerDonation, onClearSystem, activeDonation }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Load governorates and programs from Supabase (or mock data fallback)
  useEffect(() => {
    async function loadData() {
      const [govs, progs] = await Promise.all([
        getAllGovernorates(),
        getAllPrograms()
      ]);
      setGovernorates(govs);
      setPrograms(progs);
    }
    loadData();
  }, []);

  const handleGeneralDonation = () => {
    onTriggerDonation('general');
  };

  const handleLocationFixed = () => {
    if (!selectedGovernorate) {
      alert('Please select a governorate first');
      return;
    }
    onTriggerDonation('location-fixed', selectedGovernorate);
  };

  const handleProgramFixed = () => {
    if (!selectedProgram) {
      alert('Please select a program first');
      return;
    }
    onTriggerDonation('program-fixed', selectedProgram);
  };

  return (
    <>
      {/* Notch Handle - Always Visible */}
      <motion.div
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ x: 5 }}
      >
        <div
          className="h-24 w-6 rounded-r-xl flex items-center justify-center shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #00d9ff, #00ff9f)',
          }}
        >
          <motion.div
            animate={{ x: isOpen ? 0 : [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ChevronRight className="w-4 h-4 text-black" />
          </motion.div>
        </div>
      </motion.div>

      {/* Admin Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel Content */}
            <motion.div
              initial={{ x: -400 }}
              animate={{ x: 0 }}
              exit={{ x: -400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-96 z-50 overflow-y-auto"
              style={{
                background: 'rgba(0, 0, 0, 0.95)',
                borderRight: '1px solid rgba(0, 217, 255, 0.3)',
                boxShadow: '0 0 60px rgba(0, 217, 255, 0.2)',
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #00d9ff, #00ff9f)',
                      }}
                    >
                      <Dices className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                      <p className="text-xs text-gray-400">Testing Controls</p>
                    </div>
                  </div>
                </div>

                {/* Active Donation Status */}
                {activeDonation && (
                  <div
                    className="mb-6 p-4 rounded-xl border"
                    style={{
                      background: 'rgba(0, 217, 255, 0.05)',
                      borderColor: 'rgba(0, 217, 255, 0.3)',
                    }}
                  >
                    <div className="text-xs text-cyan-400 uppercase tracking-wide mb-1">
                      Active Donation
                    </div>
                    <div className="text-sm font-mono text-white">{activeDonation.id}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Stage {activeDonation.stage}/5
                    </div>
                    <div className="mt-2 h-2 bg-black/50 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, #00d9ff, #00ff9f)',
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${(activeDonation.stage / 5) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* General Donation Button */}
                <div className="mb-6">
                  <motion.button
                    onClick={handleGeneralDonation}
                    disabled={false}
                    className="w-full p-4 rounded-xl border text-left transition-all"
                    style={{
                      background: activeDonation
                        ? 'rgba(26, 26, 26, 0.5)'
                        : 'rgba(0, 217, 255, 0.1)',
                      borderColor: activeDonation
                        ? 'rgba(51, 51, 51, 0.3)'
                        : 'rgba(0, 217, 255, 0.5)',
                      opacity: activeDonation ? 0.5 : 1,
                      cursor: activeDonation ? 'not-allowed' : 'pointer',
                    }}
                    whileHover={!activeDonation ? { scale: 1.02 } : {}}
                    whileTap={!activeDonation ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #00d9ff, #00ff9f)',
                        }}
                      >
                        <Dices className="w-6 h-6 text-black" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">General Donation</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Randomize ALL (program + location + family)
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </div>

                {/* Location-Fixed Donation */}
                <div className="mb-6">
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      background: 'rgba(0, 255, 159, 0.05)',
                      borderColor: 'rgba(0, 255, 159, 0.2)',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #00ff9f, #00d9ff)',
                        }}
                      >
                        <MapPin className="w-5 h-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">Location-Fixed</div>
                        <div className="text-xs text-gray-400">Lock governorate</div>
                      </div>
                    </div>

                    <select
                      value={selectedGovernorate}
                      onChange={(e) => setSelectedGovernorate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-cyan-500/30 text-white text-sm mb-3"
                      disabled={false}
                    >
                      <option value="">Select Governorate</option>
                      {governorates.map((gov) => (
                        <option key={gov.id} value={gov.id}>
                          {gov.name}
                        </option>
                      ))}
                    </select>

                    <motion.button
                      onClick={handleLocationFixed}
                      disabled={!selectedGovernorate}
                      className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        background:
                          !activeDonation && selectedGovernorate
                            ? 'linear-gradient(135deg, #00ff9f, #00d9ff)'
                            : 'rgba(26, 26, 26, 0.5)',
                        color: !activeDonation && selectedGovernorate ? '#000' : '#666',
                        cursor:
                          activeDonation || !selectedGovernorate ? 'not-allowed' : 'pointer',
                      }}
                      whileHover={!activeDonation && selectedGovernorate ? { scale: 1.02 } : {}}
                      whileTap={!activeDonation && selectedGovernorate ? { scale: 0.98 } : {}}
                    >
                      Trigger Donation
                    </motion.button>
                  </div>
                </div>

                {/* Program-Fixed Donation */}
                <div className="mb-6">
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      background: 'rgba(255, 159, 0, 0.05)',
                      borderColor: 'rgba(255, 159, 0, 0.2)',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #ff9f00, #00ff9f)',
                        }}
                      >
                        <Package className="w-5 h-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">Program-Fixed</div>
                        <div className="text-xs text-gray-400">Lock program</div>
                      </div>
                    </div>

                    <select
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-orange-500/30 text-white text-sm mb-3"
                      disabled={false}
                    >
                      <option value="">Select Program</option>
                      {programs.map((prog) => (
                        <option key={prog.id} value={prog.id}>
                          {prog.name}
                        </option>
                      ))}
                    </select>

                    <motion.button
                      onClick={handleProgramFixed}
                      disabled={!selectedProgram}
                      className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        background:
                          !activeDonation && selectedProgram
                            ? 'linear-gradient(135deg, #ff9f00, #00ff9f)'
                            : 'rgba(26, 26, 26, 0.5)',
                        color: !activeDonation && selectedProgram ? '#000' : '#666',
                        cursor: activeDonation || !selectedProgram ? 'not-allowed' : 'pointer',
                      }}
                      whileHover={!activeDonation && selectedProgram ? { scale: 1.02 } : {}}
                      whileTap={!activeDonation && selectedProgram ? { scale: 0.98 } : {}}
                    >
                      Trigger Donation
                    </motion.button>
                  </div>
                </div>

                {/* Clear/Reset Button */}
                <div className="mt-6 pt-4 border-t border-red-500/20">
                  <motion.button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all donations and reset the system?')) {
                        onClearSystem();
                        setSelectedGovernorate('');
                        setSelectedProgram('');
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all border"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                    }}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🗑️ Clear System & Reset
                  </motion.button>
                </div>

                {/* Info Footer */}
                <div className="text-xs text-gray-500 text-center mt-4">
                  Testing only - 5s progression per stage
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
