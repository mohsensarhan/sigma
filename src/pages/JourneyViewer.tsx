/**
 * Journey Viewer - Map Visualization
 * /journey/:trackingId - Individual journey viewer with map visualization
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Map, { Source, Layer, MapRef } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import { Package, Users, ArrowLeft, AlertCircle, X } from 'lucide-react';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';
import { Journey } from '../types/journey';
import WaypointMarker from '../components/WaypointMarker';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  console.error('Missing VITE_MAPBOX_TOKEN environment variable');
}

export default function JourneyViewer() {
  const { trackingId } = useParams<{ trackingId: string }>();
  const navigate = useNavigate();
  const { getJourney } = useGlobalSettings();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (!trackingId) {
      setNotFound(true);
      return;
    }

    const foundJourney = getJourney(trackingId);
    if (foundJourney) {
      setJourney(foundJourney);
      setNotFound(false);
    } else {
      setNotFound(true);
    }

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      const updatedJourney = getJourney(trackingId);
      if (updatedJourney) {
        setJourney(updatedJourney);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [trackingId, getJourney]);

  // Fit map to journey bounds
  useEffect(() => {
    if (journey && mapRef.current) {
      const coordinates = journey.waypoints.map(w => w.coordinates);

      if (coordinates.length > 0) {
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord as [number, number]);
        }, new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]));

        mapRef.current.fitBounds(bounds, {
          padding: { top: 100, bottom: 100, left: 100, right: 100 },
          duration: 1000
        });
      }
    }
  }, [journey]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AlertCircle className="w-24 h-24 text-red-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Journey Not Found</h1>
          <p className="text-gray-400 mb-8">
            Tracking ID <span className="font-mono text-white">{trackingId}</span> does not exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-semibold transition-all flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Map
          </button>
        </motion.div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading journey...</p>
        </div>
      </div>
    );
  }

  const completedWaypoints = journey.waypoints.filter(w => w.status === 'completed');
  const activeWaypoint = journey.waypoints.find(w => w.status === 'active');
  const progress = (completedWaypoints.length / journey.waypoints.length) * 100;

  // Create line for journey path
  const completedCoordinates = completedWaypoints.map(w => w.coordinates);
  if (activeWaypoint) {
    completedCoordinates.push(activeWaypoint.coordinates);
  }

  const lineGeoJSON = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: completedCoordinates
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Mapbox Map */}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 31.5,
          latitude: 27.0,
          zoom: 6
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
      >
        {/* Journey Path Line */}
        {completedCoordinates.length > 1 && (
          <Source id="journey-line" type="geojson" data={lineGeoJSON}>
            <Layer
              id="journey-line-layer"
              type="line"
              paint={{
                'line-color': '#06b6d4',
                'line-width': 4,
                'line-opacity': 0.8
              }}
            />
            <Layer
              id="journey-line-glow"
              type="line"
              paint={{
                'line-color': '#06b6d4',
                'line-width': 12,
                'line-opacity': 0.3,
                'line-blur': 8
              }}
            />
          </Source>
        )}

        {/* Waypoint Markers - Using elegant WaypointMarker component */}
        {journey.waypoints.map((waypoint, index) => (
          <WaypointMarker
            key={waypoint.id}
            longitude={waypoint.coordinates[0]}
            latitude={waypoint.coordinates[1]}
            number={index + 1}
            status={waypoint.status}
            onClick={() => {
              // Scroll to this waypoint in the timeline
              const element = document.getElementById(`waypoint-${waypoint.id}`);
              element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }}
          />
        ))}
      </Map>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-10 px-4 py-2 bg-black/80 backdrop-blur-xl hover:bg-black/90 rounded-xl border border-cyan-500/30 text-white transition-all flex items-center gap-2 shadow-2xl"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </motion.button>

      {/* Journey Info Panel (Top Right) */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 right-6 z-10 bg-black/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden"
        style={{ maxWidth: '400px' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">Journey Tracking</h2>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {showDetails ? <X className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </button>
          </div>
          <div className="text-xs text-gray-400 font-mono break-all">{trackingId}</div>
        </div>

        {/* Progress Bar */}
        <div className="p-4 border-b border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm font-semibold text-white">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
            />
          </div>
        </div>

        {/* Status Badge */}
        <div className="p-4 border-b border-cyan-500/20">
          <div className={`inline-flex px-3 py-1 rounded-full border text-sm font-semibold ${
            journey.status === 'completed' ? 'bg-green-500/20 border-green-500/50 text-green-400' :
            journey.status === 'active' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
            'bg-gray-500/20 border-gray-500/50 text-gray-400'
          }`}>
            {journey.status.toUpperCase()}
          </div>
        </div>

        {/* Details (Collapsible) */}
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 space-y-4 max-h-[60vh] overflow-y-auto"
          >
            {/* Donation Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-500 mb-1">Donor</div>
                <div className="font-semibold text-white">{(journey.metadata as any).donorName || 'Anonymous'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Amount</div>
                <div className="font-semibold text-green-400">${(journey.metadata as any).amount || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Governorate</div>
                <div className="font-semibold text-white">{journey.metadata.governorate}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Program</div>
                <div className="font-semibold text-white">{journey.metadata.program}</div>
              </div>
            </div>

            {/* Current Stage */}
            {activeWaypoint && (
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <div className="text-xs text-gray-400 mb-2">CURRENT LOCATION</div>
                <div className="font-bold text-white mb-1">{activeWaypoint.name}</div>
                <div className="text-sm text-gray-400 mb-3">{activeWaypoint.location}</div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300">{activeWaypoint.details.quantity} packages</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300">{activeWaypoint.details.beneficiaries} people</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <div className="text-xs text-gray-400 mb-3">JOURNEY STAGES</div>
              <div className="space-y-2">
                {journey.waypoints.map((waypoint, index) => (
                  <div
                    key={waypoint.id}
                    id={`waypoint-${waypoint.id}`}
                    className={`p-2 rounded-lg border text-sm ${
                      waypoint.status === 'completed' ? 'bg-green-500/10 border-green-500/30' :
                      waypoint.status === 'active' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-gray-800/30 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: waypoint.status === 'completed' ? '#00ff9f' :
                                         waypoint.status === 'active' ? '#00d9ff' : '#1a1a1a',
                          color: waypoint.status === 'pending' ? '#666' : '#000'
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{waypoint.name}</div>
                        <div className="text-xs text-gray-400">{waypoint.location}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Legend (Bottom Left) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-6 z-10 bg-black/80 backdrop-blur-xl rounded-xl border border-cyan-500/30 p-4 shadow-2xl"
      >
        <div className="text-xs text-gray-400 mb-2">STAGE STATUS</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#00ff9f' }}></div>
            <span className="text-sm text-white">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#00d9ff' }}></div>
            <span className="text-sm text-white">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-700"></div>
            <span className="text-sm text-white">Pending</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
