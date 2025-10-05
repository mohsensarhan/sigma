import { useState, useRef, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Map, { Layer, Source, MapRef } from 'react-map-gl/mapbox';
import { motion } from 'framer-motion';
import WaypointMarker from './components/WaypointMarker';
import DonationInfoPanel from './components/DonationInfoPanel';
import WaypointControlCard from './components/WaypointControlCard';
import MobileDrawer from './components/MobileDrawer';
import AdminPanel from './components/AdminPanel';
import SMSLogsPanel from './components/SMSLogsPanel';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Waypoint } from './data/waypoints';
import { useJourneyManager } from './hooks/useJourneyManager';
import { generateJourney } from './data/journeyGenerator';
import { selectBeneficiary } from './data/selectionAlgorithm';
import type { DonationType } from './types/database';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  throw new Error('Missing VITE_MAPBOX_TOKEN environment variable. Check .env.local file.');
}

// Main donation tracking component with MULTI-JOURNEY support
function DonationTracker() {
  const mapRef = useRef<MapRef>(null);
  const [activeWaypoint, setActiveWaypoint] = useState<Waypoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Multi-journey manager
  const {
    state,
    startJourney,
    clearAllJourneys,
    getAllWaypoints
  } = useJourneyManager({
    onJourneyStageUpdate: (journeyId, stage) => {
      console.log(`🚀 Journey ${journeyId} → Stage ${stage}/5`);
    },
    onJourneyComplete: (journeyId) => {
      console.log(`✅ Journey ${journeyId} COMPLETED`);
    }
  });

  // Get all waypoints from all active journeys
  const waypoints = getAllWaypoints();

  // Handle donation triggers from admin panel
  const handleTriggerDonation = async (type: DonationType, fixedId?: string) => {
    try {
      // Select beneficiary based on donation type
      const selection = await selectBeneficiary(type, fixedId);

      // Generate journey waypoints
      const journeyWaypoints = generateJourney(selection);
      const journeyId = journeyWaypoints[0].details.packageId;

      // Start new journey (concurrent with any existing journeys)
      startJourney(
        journeyId,
        journeyWaypoints,
        type,
        {
          governorate: selection.governorate.name,
          program: selection.program.name,
          familyId: selection.family.id,
          familyProfile: selection.family.profile
        }
      );

      console.log(`🎯 New journey started: ${journeyId}`);
    } catch (error) {
      console.error('Error triggering donation:', error);
      alert('Failed to trigger donation. Please try again.');
    }
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
    (clickedId: number, journeyId?: string) => {
      const clickedWaypoint = waypoints.find((w) =>
        w.id === clickedId && (!journeyId || w.journeyId === journeyId)
      );
      if (!clickedWaypoint) return;

      setActiveWaypoint(clickedWaypoint);

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: clickedWaypoint.coordinates,
          zoom: 10,
          duration: 1500
        });
      }
    },
    [waypoints]
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
            key={`${waypoint.journeyId}-${waypoint.id}`}
            longitude={waypoint.coordinates[0]}
            latitude={waypoint.coordinates[1]}
            number={waypoint.id}
            status={waypoint.status}
            onClick={() => handleWaypointClick(waypoint.id, waypoint.journeyId)}
          />
        ))}
      </Map>

      <DonationInfoPanel waypoint={activeWaypoint} />

      <WaypointControlCard waypoints={waypoints} onWaypointClick={(id) => handleWaypointClick(id)} />

      <MobileDrawer
        waypoints={waypoints}
        onWaypointClick={(id) => handleWaypointClick(id)}
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      <AdminPanel
        onTriggerDonation={handleTriggerDonation}
        onClearSystem={clearAllJourneys}
        activeDonation={
          state.journeys.length > 0
            ? {
                id: `${state.activeCount} active, ${state.completedCount} completed`,
                stage: state.journeys[0]?.currentStage || 0
              }
            : null
        }
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

      {/* Multi-Journey Status HUD */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-6 right-6 z-10 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-cyan-500/30"
      >
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 font-semibold">{state.activeCount} Active</span>
          </div>
          <div className="w-px h-4 bg-cyan-500/30" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-cyan-400">{state.completedCount} Completed</span>
          </div>
          <div className="w-px h-4 bg-cyan-500/30" />
          <div className="text-white/70">
            Total: <span className="text-white font-semibold">{state.totalCount}</span>
          </div>
        </div>
      </motion.div>

      {/* SMS Logs Panel */}
      <SMSLogsPanel />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<DonationTracker />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
