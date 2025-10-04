import { useState, useRef, useCallback, useEffect } from 'react';
import Map, { Layer, Source, MapRef } from 'react-map-gl/mapbox';
import { motion } from 'framer-motion';
import WaypointMarker from './components/WaypointMarker';
import DonationInfoPanel from './components/DonationInfoPanel';
import WaypointControlCard from './components/WaypointControlCard';
import MobileDrawer from './components/MobileDrawer';
import AdminPanel from './components/AdminPanel';
import { Waypoint } from './data/waypoints';
import { useJourneyAnimation } from './hooks/useJourneyAnimation';
import { generateJourney } from './data/journeyGenerator';
import { selectBeneficiary } from './data/selectionAlgorithm';
import type { DonationType } from './types/database';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  throw new Error('Missing VITE_MAPBOX_TOKEN environment variable. Check .env.local file.');
}

// Create empty initial state - all waypoints are "powered off"
const EMPTY_WAYPOINTS: Waypoint[] = [];

function App() {
  const mapRef = useRef<MapRef>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>(EMPTY_WAYPOINTS);
  const [activeWaypoint, setActiveWaypoint] = useState<Waypoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeDonation, setActiveDonation] = useState<{ id: string; stage: number } | null>(null);

  // Connect journey animation hook
  const { startJourney } = useJourneyAnimation({
    waypoints,
    setWaypoints,
    onStageComplete: (completedStageId, updatedWaypoints) => {
      // When a stage completes, the NEXT stage becomes active
      const nextStageId = completedStageId + 1;

      if (nextStageId <= 5) {
        // Update to show the newly active stage
        setActiveDonation(prev => prev ? { ...prev, stage: nextStageId } : null);
        // Use updatedWaypoints from callback to avoid stale closure
        setActiveWaypoint(updatedWaypoints.find(w => w.id === nextStageId) || null);
      } else {
        // Stage 5 completed - keep it visible, don't clear
        // User must manually click "Clear System & Reset"
        setActiveDonation(prev => prev ? { ...prev, stage: 5 } : null);
        setActiveWaypoint(updatedWaypoints.find(w => w.id === 5) || null);
      }
    },
    onJourneyComplete: () => {
      // Journey complete - but keep everything visible
      // Only clear when user manually clicks reset button
    }
  });

  // Handle donation triggers from admin panel
  const handleTriggerDonation = async (type: DonationType, fixedId?: string) => {
    try {
      // Select beneficiary based on donation type
      const selection = await selectBeneficiary(type, fixedId);

      // Generate journey waypoints (already in correct format)
      const journeyWaypoints = generateJourney(selection);

      // Set active donation
      setActiveDonation({
        id: journeyWaypoints[0].details.packageId,
        stage: 1
      });
      setWaypoints(journeyWaypoints);

      // Start the journey animation
      setTimeout(() => {
        startJourney();
      }, 500);

    } catch (error) {
      console.error('Error triggering donation:', error);
      alert('Failed to trigger donation. Please try again.');
    }
  };

  // Handle clearing/resetting the system
  const handleClearSystem = () => {
    setWaypoints(EMPTY_WAYPOINTS);
    setActiveDonation(null);
    setActiveWaypoint(null);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeWaypointIds = waypoints
    .filter((w) => w.status === 'active' || w.status === 'completed')
    .map((w) => w.id);

  const createPathGeoJSON = () => {
    if (activeWaypointIds.length < 2) return null;

    const activePoints = waypoints
      .filter((w) => activeWaypointIds.includes(w.id))
      .sort((a, b) => a.id - b.id);

    const coordinates = activePoints.map((w) => w.coordinates);

    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates,
      },
    };
  };

  const pathGeoJSON = createPathGeoJSON();

  const handleWaypointClick = useCallback(
    (clickedId: number) => {
      const clickedWaypoint = waypoints.find((w) => w.id === clickedId);
      if (!clickedWaypoint) return;

      const currentMaxActive = Math.max(
        0,
        ...waypoints.filter((w) => w.status === 'active' || w.status === 'completed').map((w) => w.id)
      );

      const updatedWaypoints = waypoints.map((w) => {
        if (w.id < clickedId) {
          return { ...w, status: 'completed' as const };
        } else if (w.id === clickedId) {
          return { ...w, status: 'active' as const };
        } else if (w.id > clickedId && w.id <= currentMaxActive) {
          return { ...w, status: 'pending' as const };
        }
        return w;
      });

      setWaypoints(updatedWaypoints);
      setActiveWaypoint(clickedWaypoint);

      const activePoints = updatedWaypoints
        .filter((w) => w.id <= clickedId)
        .map((w) => w.coordinates);

      if (activePoints.length > 0 && mapRef.current) {
        const bounds: [[number, number], [number, number]] = [
          [
            Math.min(...activePoints.map((p) => p[0])) - 0.5,
            Math.min(...activePoints.map((p) => p[1])) - 0.5,
          ],
          [
            Math.max(...activePoints.map((p) => p[0])) + 0.5,
            Math.max(...activePoints.map((p) => p[1])) + 0.5,
          ],
        ];

        const padding = isMobile
          ? { top: 100, bottom: 200, left: 40, right: 40 }
          : { top: 100, bottom: 100, left: 450, right: 450 };

        mapRef.current.fitBounds(bounds, {
          padding,
          duration: 1500,
          maxZoom: 8,
        });
      }
    },
    [waypoints, isMobile]
  );

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.fitBounds(
        [
          [29.0, 22.0],
          [35.0, 32.0],
        ],
        {
          padding: 50,
          duration: 0,
        }
      );
    }
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 31.5,
          latitude: 26.8,
          zoom: 5.5,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        {pathGeoJSON && (
          <Source id="route" type="geojson" data={pathGeoJSON}>
            <Layer
              id="route-line-glow"
              type="line"
              paint={{
                'line-color': '#00d9ff',
                'line-width': 8,
                'line-blur': 4,
                'line-opacity': 0.6,
              }}
            />
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#00ff9f',
                'line-width': 3,
                'line-opacity': 1,
              }}
            />
            <Layer
              id="route-line-animated"
              type="line"
              paint={{
                'line-color': '#ffffff',
                'line-width': 2,
                'line-opacity': 0.8,
                'line-dasharray': [0, 4, 3],
              }}
            />
          </Source>
        )}

        {waypoints.map((waypoint) => (
          <WaypointMarker
            key={waypoint.id}
            longitude={waypoint.coordinates[0]}
            latitude={waypoint.coordinates[1]}
            number={waypoint.id}
            status={waypoint.status}
            onClick={() => handleWaypointClick(waypoint.id)}
          />
        ))}
      </Map>

      <DonationInfoPanel waypoint={activeWaypoint} />

      <WaypointControlCard waypoints={waypoints} onWaypointClick={handleWaypointClick} />

      <MobileDrawer
        waypoints={waypoints}
        onWaypointClick={handleWaypointClick}
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      <AdminPanel
        onTriggerDonation={handleTriggerDonation}
        onClearSystem={handleClearSystem}
        activeDonation={activeDonation}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed top-6 left-6 z-10"
      >
        <img
          src="/efb logo.png"
          alt="Egyptian Food Bank"
          className="h-12 w-auto"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(0, 217, 255, 0.3))'
          }}
        />
      </motion.div>
    </div>
  );
}

export default App;
