import { motion, useAnimation } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { Waypoint } from '../data/waypoints';
import { Check, ChevronUp } from 'lucide-react';
import { useEffect } from 'react';

interface MobileDrawerProps {
  waypoints: Waypoint[];
  onWaypointClick: (id: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function MobileDrawer({
  waypoints,
  onWaypointClick,
  isOpen,
  onToggle,
}: MobileDrawerProps) {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      y: 0,
      transition: { type: 'spring', damping: 30, stiffness: 300 },
    });
  }, [isOpen, controls]);

  const bind = useDrag(
    ({ last, velocity: [, vy], movement: [, my] }) => {
      if (last) {
        if (my > 100 || vy > 0.5) {
          if (isOpen) {onToggle();}
        } else if (my < -100 || vy < -0.5) {
          if (!isOpen) {onToggle();}
        } else {
          controls.start({
            y: 0,
            transition: { type: 'spring', damping: 30, stiffness: 300 },
          });
        }
      } else {
        controls.start({
          y: Math.max(0, my),
          transition: { type: 'spring', damping: 50, stiffness: 500 },
        });
      }
    },
    { axis: 'y', filterTaps: true }
  );

  return (
    <motion.div
      {...(bind() as any)}
      animate={controls}
      className="fixed bottom-0 left-0 right-0 z-20 md:hidden touch-none"
      style={{
        y: 0,
      }}
    >
      <div
        className="backdrop-blur-xl rounded-t-3xl border-t border-x shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          borderColor: 'rgba(0, 217, 255, 0.3)',
          boxShadow: '0 -10px 40px rgba(0, 217, 255, 0.1)',
        }}
      >
        <div className="px-6 pt-2 pb-0">
          <div className="flex justify-center mb-2">
            <motion.button
              onClick={onToggle}
              className="w-12 h-1.5 rounded-full"
              style={{ background: 'rgba(0, 217, 255, 0.5)' }}
              whileTap={{ scale: 0.95 }}
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-cyan-400 uppercase tracking-wider font-bold">
              Journey Progress
            </div>
            <motion.button
              onClick={onToggle}
              className="p-2 rounded-full"
              style={{ background: 'rgba(0, 217, 255, 0.1)' }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronUp
                className="w-4 h-4 text-cyan-400"
                style={{
                  transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.3s',
                }}
              />
            </motion.button>
          </div>

          <motion.div
            initial={false}
            animate={{
              height: isOpen ? 'auto' : 0,
              opacity: isOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {waypoints.map((waypoint) => {
                const isCompleted = waypoint.status === 'completed';
                const isActive = waypoint.status === 'active';

                return (
                  <motion.button
                    key={`${waypoint.journeyId || 'default'}-${waypoint.id}`}
                    onClick={() => {
                      onWaypointClick(waypoint.id);
                      onToggle();
                    }}
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
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 flex-shrink-0"
                        style={{
                          backgroundColor: isCompleted
                            ? '#00ff9f'
                            : isActive
                              ? '#00d9ff'
                              : '#1a1a1a',
                          borderColor: isCompleted ? '#00ff9f' : isActive ? '#00d9ff' : '#333',
                          color: isCompleted || isActive ? '#000' : '#666',
                        }}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : waypoint.id}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs uppercase tracking-wider"
                          style={{
                            color: isActive ? '#00d9ff' : isCompleted ? '#00ff9f' : '#666',
                          }}
                        >
                          {waypoint.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {waypoint.location}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-cyan-500/20">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Distance</span>
                <span className="text-cyan-400 font-mono">1,371 km</span>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-gray-400">Estimated Time</span>
                <span className="text-cyan-400 font-mono">24.5 hours</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
