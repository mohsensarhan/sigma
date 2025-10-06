import { motion } from 'framer-motion';
import { Marker } from 'react-map-gl';

interface WaypointMarkerProps {
  longitude: number;
  latitude: number;
  number: number;
  status: 'pending' | 'active' | 'completed';
  onClick: () => void;
}

export default function WaypointMarker({
  longitude,
  latitude,
  number,
  status,
  onClick,
}: WaypointMarkerProps) {
  const getColors = () => {
    switch (status) {
      case 'completed':
        return {
          bg: '#00ff9f',
          glow: '#00ff9f',
          text: '#000',
        };
      case 'active':
        return {
          bg: '#00d9ff',
          glow: '#00d9ff',
          text: '#000',
        };
      default:
        return {
          bg: '#1a1a1a',
          glow: '#333',
          text: '#666',
        };
    }
  };

  const colors = getColors();

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <motion.div
        onClick={onClick}
        className="relative cursor-pointer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        role="button"
        tabIndex={0}
        aria-label={`Waypoint ${number} - ${status}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {status === 'active' && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: colors.glow,
                filter: 'blur(8px)',
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 0.3, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: colors.glow,
              }}
              animate={{
                scale: [1, 2, 2],
                opacity: [0.8, 0, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          </>
        )}

        <motion.div
          className="relative flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg border-2"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.glow,
            color: colors.text,
            boxShadow: `0 0 20px ${colors.glow}`,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {number}
        </motion.div>
      </motion.div>
    </Marker>
  );
}