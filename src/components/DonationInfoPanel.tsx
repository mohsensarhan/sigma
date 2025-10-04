import { motion, AnimatePresence } from 'framer-motion';
import { Waypoint } from '../data/waypoints';
import { Package, MapPin, Users, User } from 'lucide-react';

interface DonationInfoPanelProps {
  waypoint: Waypoint | null;
}

export default function DonationInfoPanel({ waypoint }: DonationInfoPanelProps) {
  if (!waypoint) return null;

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) => (
    <div className="flex items-center gap-1.5 py-0.5 border-b border-cyan-500/10">
      <Icon className="w-3 h-3 text-cyan-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-gray-400 uppercase tracking-wide leading-none">{label}</div>
        <div className="text-[11px] text-white font-mono leading-none mt-0.5 break-words">{value}</div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="fixed top-24 left-6 w-72 max-w-[calc(100vw-3rem)] z-10"
    >
      <div
        className="backdrop-blur-xl rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          borderColor: 'rgba(0, 217, 255, 0.3)',
          boxShadow: '0 0 40px rgba(0, 217, 255, 0.15)',
        }}
      >
        <div className="px-3 py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={waypoint.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{
                    background: 'linear-gradient(135deg, #00d9ff, #00ff9f)',
                    color: '#000',
                  }}
                >
                  {waypoint.id}
                </div>
                <div className="flex-1">
                  <div className="text-[9px] text-cyan-400 uppercase tracking-wide leading-none">{waypoint.stage}</div>
                  <div className="text-sm font-bold text-white leading-none mt-0.5">{waypoint.name}</div>
                </div>
              </div>

              <div className="space-y-0">
                <InfoRow label="Location" value={waypoint.location} icon={MapPin} />
                <InfoRow label="Package ID" value={waypoint.details.packageId} icon={Package} />
                <InfoRow label="Beneficiaries" value={`${waypoint.details.beneficiaries} families`} icon={Users} />
                
                {/* Show family profile if available */}
                {waypoint.details.familyProfile && (
                  <InfoRow label="Family Profile" value={waypoint.details.familyProfile} icon={User} />
                )}

                {waypoint.details.distanceFromPrevious && (
                  <InfoRow
                    label="Distance"
                    value={`${waypoint.details.distanceFromPrevious} km`}
                    icon={MapPin}
                  />
                )}
              </div>

              <div className="mt-1.5 p-1.5 rounded-lg" style={{ background: 'rgba(0, 217, 255, 0.05)' }}>
                <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 leading-none">Package Contents</div>
                <div className="flex flex-wrap gap-1">
                  {waypoint.details.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono leading-none"
                      style={{
                        background: 'rgba(0, 255, 159, 0.1)',
                        color: '#00ff9f',
                        border: '1px solid rgba(0, 255, 159, 0.2)',
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
