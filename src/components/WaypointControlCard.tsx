import { motion } from 'framer-motion';
import { Waypoint } from '../data/waypoints';
import { Check } from 'lucide-react';

interface WaypointControlCardProps {
  waypoints: Waypoint[];
  onWaypointClick: (id: number) => void;
}

export default function WaypointControlCard({ waypoints, onWaypointClick }: WaypointControlCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 right-6 w-80 max-w-[calc(100vw-3rem)] z-10 hidden md:block"
    >
      <div
        className="backdrop-blur-xl rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          borderColor: 'rgba(0, 217, 255, 0.3)',
          boxShadow: '0 0 40px rgba(0, 217, 255, 0.1)',
        }}
      >
        <div className="p-4 pb-3">
          <div className="text-xs text-cyan-400 uppercase tracking-wider mb-3 font-bold">
            Journey Progress
          </div>
          <div className="space-y-1.5">
            {waypoints.map((waypoint, index) => {
              const isCompleted = waypoint.status === 'completed';
              const isActive = waypoint.status === 'active';
              const isPending = waypoint.status === 'pending';

              return (
                <motion.div
                  key={waypoint.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.button
                    onClick={() => onWaypointClick(waypoint.id)}
                    className="w-full p-3 rounded-xl border transition-all duration-300 text-left"
                    style={{
                      background: isActive
                        ? 'rgba(0, 217, 255, 0.1)'
                        : isCompleted
                        ? 'rgba(0, 255, 159, 0.05)'
                        : 'rgba(26, 26, 26, 0.5)',
                      borderColor: isActive
                        ? 'rgba(0, 217, 255, 0.5)'
                        : isCompleted
                        ? 'rgba(0, 255, 159, 0.3)'
                        : 'rgba(51, 51, 51, 0.3)',
                    }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: isActive
                        ? '0 0 30px rgba(0, 217, 255, 0.3)'
                        : '0 0 20px rgba(0, 255, 159, 0.2)',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex-shrink-0">
                        <motion.div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2"
                          style={{
                            backgroundColor: isCompleted
                              ? '#00ff9f'
                              : isActive
                              ? '#00d9ff'
                              : '#1a1a1a',
                            borderColor: isCompleted
                              ? '#00ff9f'
                              : isActive
                              ? '#00d9ff'
                              : '#333',
                            color: isCompleted || isActive ? '#000' : '#666',
                          }}
                          animate={
                            isActive
                              ? {
                                  boxShadow: [
                                    '0 0 10px rgba(0, 217, 255, 0.5)',
                                    '0 0 20px rgba(0, 217, 255, 0.8)',
                                    '0 0 10px rgba(0, 217, 255, 0.5)',
                                  ],
                                }
                              : {}
                          }
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          {isCompleted ? <Check className="w-4 h-4" /> : waypoint.id}
                        </motion.div>

                        {isActive && (
                          <motion.div
                            className="absolute inset-0 rounded-full border-2"
                            style={{ borderColor: '#00d9ff' }}
                            animate={{
                              scale: [1, 1.5, 1.5],
                              opacity: [0.8, 0, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeOut',
                            }}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[10px] uppercase tracking-wide leading-none"
                          style={{
                            color: isActive ? '#00d9ff' : isCompleted ? '#00ff9f' : '#666',
                          }}
                        >
                          {waypoint.stage}
                        </div>
                        <div
                          className="font-semibold text-sm truncate leading-none mt-1"
                          style={{
                            color: isPending ? '#666' : '#fff',
                          }}
                        >
                          {waypoint.name}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 truncate leading-none">
                          {waypoint.location}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-cyan-500/20">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-400">Total Distance</span>
              <span className="text-cyan-400 font-mono">1,371 km</span>
            </div>
            <div className="flex justify-between text-[10px] mt-1.5">
              <span className="text-gray-400">Estimated Time</span>
              <span className="text-cyan-400 font-mono">24.5 hours</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
