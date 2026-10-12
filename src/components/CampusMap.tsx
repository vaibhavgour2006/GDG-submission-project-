import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Checkpoint, Participant, GPSPosition } from '../types/game';
import { isInsideGeofence, calculateDistance } from '../services/geofenceService';
import { sounds } from '../services/soundEffects';
import { MAP_LAYERS, MapTileStyle, MAP_TILE_CONFIG } from '../config/mapConfig';
import { 
  Crosshair, 
  MapPin, 
  Navigation, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Layers, 
  RotateCw,
  Compass,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  ListTodo,
  ChevronDown,
  ChevronUp,
  Circle,
  Lock,
  X,
  Coffee
} from 'lucide-react';

interface CampusMapProps {
  checkpoints: Checkpoint[];
  participant: Participant;
  activeCheckpoint: Checkpoint;
  currentPosition: GPSPosition | null;
  isSimulated: boolean;
  onPositionUpdate: (pos: GPSPosition, simulated: boolean) => void;
  onEnterCheckpoint: (checkpoint: Checkpoint) => void;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  checkpoints,
  participant,
  activeCheckpoint,
  currentPosition,
  isSimulated,
  onPositionUpdate,
  onEnterCheckpoint
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const playerMarkerRef = useRef<L.Marker | null>(null);
  const playerAccuracyCircleRef = useRef<L.Circle | null>(null);
  const checkpointMarkersRef = useRef<Record<string, { marker: L.Marker; circle: L.Circle }>>({});

  const [geoError, setGeoError] = useState<string | null>(null);
  // Default to satellite map view
  const [selectedLayerStyle, setSelectedLayerStyle] = useState<MapTileStyle>('satellite');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tasks List dropdown in left corner
  const [showTaskList, setShowTaskList] = useState(false);

  // Real world geo-linked compass heading state & minimized info toggle
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompassSupport, setHasCompassSupport] = useState<boolean>(false);
  const [showCompassInfo, setShowCompassInfo] = useState<boolean>(false);
  const [mapNotice, setMapNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!mapNotice) return;
    const timer = setTimeout(() => setMapNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [mapNotice]);

  // Live ticker to re-render map markers and buttons every second while any character timeout cooldown is active
  const [cooldownTick, setCooldownTick] = useState<number>(0);

  useEffect(() => {
    const hasActiveCooldown = Object.values(participant.characterCooldowns || {}).some(
      (until) => until > Date.now()
    );
    if (!hasActiveCooldown) return;

    const interval = setInterval(() => {
      setCooldownTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [participant.characterCooldowns, cooldownTick]);

  // Active checkpoint cooldown status
  const activeCooldownUntil = participant.characterCooldowns?.[activeCheckpoint.id] || 0;
  const isActiveCooldown = activeCooldownUntil > Date.now();
  const activeCooldownSecs = Math.max(0, Math.ceil((activeCooldownUntil - Date.now()) / 1000));

  const handleToggleFullscreen = () => {
    sounds.playClick();
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 500);
      return next;
    });
  };

  // Keyboard shortcut: Escape exits fullscreen map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Active boost meters
  const boostMeters = participant.activeBoost && participant.activeBoost.expiresAt > Date.now()
    ? participant.activeBoost.boostMeters
    : 0;

  // Haversine distance to active checkpoint
  const activeDistance = currentPosition
    ? isInsideGeofence(
        currentPosition.latitude,
        currentPosition.longitude,
        activeCheckpoint.latitude,
        activeCheckpoint.longitude,
        activeCheckpoint.radiusMeters,
        boostMeters
      )
    : null;

  // Helper to attach or swap tile layer
  const applyTileLayer = (map: L.Map, styleId: MapTileStyle) => {
    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
    }

    const layerCfg = MAP_LAYERS[styleId] || MAP_LAYERS.carto_dark;
    const tileLayer = L.tileLayer(layerCfg.url, {
      maxZoom: layerCfg.maxZoom,
      subdomains: layerCfg.subdomains || 'abc',
      attribution: layerCfg.attribution
    });

    // Fallback on tile error: if CARTO tile fails, fall back to OpenStreetMap
    tileLayer.on('tileerror', () => {
      console.warn('Map tile load notice: activating standard fallback layer');
    });

    tileLayer.addTo(map);
    activeTileLayerRef.current = tileLayer;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center map around IET DAVV Indore
    const map = L.map(mapContainerRef.current, {
      center: [activeCheckpoint.latitude, activeCheckpoint.longitude],
      zoom: 17,
      zoomControl: false,
      attributionControl: false
    });

    // Apply active tile layer (CARTO Dark Matter with ?key= API key)
    applyTileLayer(map, selectedLayerStyle);

    mapInstanceRef.current = map;

    // Fix container size invalidation issue in flex/grid layouts
    const resizeTimers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 350),
      setTimeout(() => map.invalidateSize(), 800)
    ];

    const handleWindowResize = () => map.invalidateSize();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeTimers.forEach(t => clearTimeout(t));
      window.removeEventListener('resize', handleWindowResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when user switches style
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    applyTileLayer(map, selectedLayerStyle);
  }, [selectedLayerStyle]);

  // Real world Geo-linked Compass heading tracking
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading is iOS true heading, alpha is Android/Standard
      let heading: number | null = null;
      if ((e as any).webkitCompassHeading !== undefined && (e as any).webkitCompassHeading !== null) {
        heading = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null && e.alpha !== undefined) {
        // Standard Android: 360 - alpha
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null && !isNaN(heading)) {
        setDeviceHeading(Math.round(heading));
        setHasCompassSupport(true);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  // Compute geographical bearing from player's current GPS position to the active checkpoint
  const calculateBearingToCheckpoint = (): number => {
    if (!currentPosition) return 0;
    const lat1 = (currentPosition.latitude * Math.PI) / 180;
    const lat2 = (activeCheckpoint.latitude * Math.PI) / 180;
    const dLon = ((activeCheckpoint.longitude - currentPosition.longitude) * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  };

  const bearingToTarget = Math.round(calculateBearingToCheckpoint());
  // Cardinal direction helper
  const getCardinal = (deg: number) => {
    const val = Math.floor((deg / 45) + 0.5);
    const arr = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return arr[val % 8];
  };

  // Smooth zoom-to-marker animation when a user clicks a checkpoint in the task list
  const handleZoomToCheckpoint = (cp: Checkpoint) => {
    sounds.playClick();
    const map = mapInstanceRef.current;
    if (!map) return;

    const isCompleted = participant.completedStages.includes(cp.stageNumber);
    const isActive = cp.stageNumber === participant.currentStage;
    const isLocked = cp.stageNumber > participant.currentStage;

    if (isLocked) {
      const prevCharacter = checkpoints.find(c => c.stageNumber === cp.stageNumber - 1)?.characterName || 'the previous stage';
      setMapNotice(`🔒 Stage ${cp.stageNumber} (${cp.characterName}) is locked! Complete ${prevCharacter} first to unlock.`);
      return;
    }

    // High quality smooth cinematic zoom-to-marker animation in Leaflet
    map.flyTo([cp.latitude, cp.longitude], 18.5, {
      animate: true,
      duration: 1.5,
      easeLinearity: 0.25
    });

    // Tactile RPG bounce and highlight ripple on the marker DOM element
    const markerObj = checkpointMarkersRef.current[cp.id];
    if (markerObj && markerObj.marker) {
      const el = markerObj.marker.getElement();
      if (el) {
        el.classList.remove('marker-focus-bounce');
        void el.offsetWidth; // trigger reflow
        el.classList.add('marker-focus-bounce');
        setTimeout(() => el.classList.remove('marker-focus-bounce'), 1500);
      }
    }

    // Compute live distance if player GPS available
    const dist = currentPosition
      ? calculateDistance(currentPosition.latitude, currentPosition.longitude, cp.latitude, cp.longitude)
      : null;

    const cooldownUntil = participant.characterCooldowns?.[cp.id] || 0;
    const isCooldownActive = isActive && cooldownUntil > Date.now();
    const cooldownSecs = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));

    if (isCooldownActive) {
      setMapNotice(`☕ ${cp.characterName} is taking a break! Disabled for ${cooldownSecs}s. Please wait before retrying!`);
    } else if (isActive) {
      setMapNotice(`🎯 Navigating to ${cp.characterName} (${cp.name}) • ${dist !== null ? `${dist}m away` : 'Active Target'}`);
    } else if (isCompleted) {
      setMapNotice(`✓ Stage ${cp.stageNumber} Cleared: ${cp.characterName} • Fragment retrieved!`);
    }
  };

  // Update Checkpoint Markers & Geofences
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers if any
    Object.values(checkpointMarkersRef.current).forEach(({ marker, circle }) => {
      marker.remove();
      circle.remove();
    });
    checkpointMarkersRef.current = {};

    checkpoints.forEach((cp) => {
      const isCompleted = participant.completedStages.includes(cp.stageNumber);
      const isActive = cp.stageNumber === participant.currentStage;

      // RULE: Make checkpoints invisible on map whose task hasn't appeared yet.
      // (Only the current active character and previously completed characters appear on the map)
      if (!isCompleted && !isActive) {
        return;
      }

      // Check if character is currently on 10s timeout cooldown
      const cooldownUntil = participant.characterCooldowns?.[cp.id] || 0;
      const isCooldownActive = isActive && cooldownUntil > Date.now();
      const cooldownSecs = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));

      // Radius: Completed character circle shrinks significantly (35% size, min 8m)
      const radius = isCompleted
        ? Math.max(8, Math.round(cp.radiusMeters * 0.35))
        : cp.radiusMeters + (isActive ? boostMeters : 0);

      // Color styling: Completed is faded grey; cooldown is amber break; active is vibrant cyan
      let strokeColor = '#64748b'; // slate grey
      let fillColor = '#334155';
      let badgeBg = 'bg-slate-800/90 text-slate-400 border border-slate-700';

      if (isCompleted) {
        strokeColor = '#64748b'; // muted grey outline
        fillColor = '#334155';   // muted grey fill
        badgeBg = 'bg-slate-800/85 text-slate-400 border border-slate-700/70';
      } else if (isCooldownActive) {
        strokeColor = '#f59e0b'; // amber on-break outline
        fillColor = '#b45309';   // warm amber fill
        badgeBg = 'bg-amber-950/95 text-amber-300 border border-amber-500 shadow-md shadow-amber-900/40 animate-pulse';
      } else if (isActive) {
        strokeColor = '#06b6d4'; // bright cyan
        fillColor = '#06b6d4';
        badgeBg = 'bg-cyan-500 text-slate-950 font-bold';
      }

      // Create Geofence Circle: Shrinks, fades, or turns amber dashed while disabled on timeout cooldown
      const circle = L.circle([cp.latitude, cp.longitude], {
        radius,
        color: strokeColor,
        fillColor,
        fillOpacity: isCooldownActive ? 0.08 : isActive ? 0.22 : 0.04,
        opacity: isCompleted ? 0.35 : isCooldownActive ? 0.6 : 0.9,
        weight: isActive ? (isCooldownActive ? 1.5 : 2.5) : 1,
        dashArray: isCooldownActive ? '5, 5' : isActive ? '6, 6' : isCompleted ? '3, 4' : undefined,
        className: isActive && !isCooldownActive ? 'active-geofence-pulse' : undefined
      }).addTo(map);

      // Custom HTML Marker: Disabled during cooldown (amber, break badge, disabled cursor)
      const customIcon = L.divIcon({
        className: 'custom-checkpoint-marker',
        html: `
          <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full select-none ${
            isCooldownActive
              ? 'cursor-not-allowed opacity-90'
              : isCompleted
              ? 'cursor-pointer opacity-65 hover:opacity-100 transition-opacity'
              : 'cursor-pointer group'
          }">
            ${
              isActive && !isCooldownActive
                ? `<div class="active-marker-beacon"></div><div class="active-marker-beacon-delayed"></div>`
                : ''
            }
            <div class="relative z-10 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-md whitespace-nowrap mb-1 border flex items-center gap-1.5 ${badgeBg}">
              ${isActive && !isCooldownActive ? '<span class="w-1.5 h-1.5 rounded-full bg-cyan-950 animate-ping inline-block"></span>' : ''}
              ${isCompleted ? '<span class="text-slate-400 text-[9px] font-bold">✓</span>' : ''}
              ${isCooldownActive ? '<span class="text-xs">☕</span>' : ''}
              <span>${isCooldownActive ? `ON BREAK (00:0${cooldownSecs}s)` : `${cp.stageNumber}. ${cp.characterName}`}</span>
            </div>
            <div class="relative z-10 ${isCompleted ? 'w-8 h-8 text-base rounded-xl' : 'w-11 h-11 text-xl rounded-2xl'} flex items-center justify-center shadow-lg transition-transform border-2 ${
              isCooldownActive
                ? 'bg-amber-950/95 border-amber-500 text-amber-300 ring-4 ring-amber-500/30 grayscale contrast-125 cursor-not-allowed'
                : isActive
                ? 'bg-cyan-950/90 border-cyan-300 shadow-cyan-500/60 ring-4 ring-cyan-500/30 active-marker-pulse group-hover:scale-105'
                : 'bg-slate-900/90 border-slate-600 text-slate-400 grayscale contrast-75 group-hover:scale-105'
            }">
              ${cp.characterAvatar}
              ${
                isCooldownActive
                  ? '<span class="absolute -bottom-1 -right-1 bg-slate-950 border border-amber-500 rounded-full w-4 h-4 text-[9px] flex items-center justify-center shadow">☕</span>'
                  : ''
              }
            </div>
            <!-- Pinpoint anchor -->
            <div class="relative z-10 flex items-center justify-center mt-1 w-3 h-3">
              <div class="w-1.5 h-1.5 rounded-full ${
                isCooldownActive
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : isActive
                  ? 'bg-cyan-300 shadow-[0_0_8px_#22d3ee]'
                  : 'bg-slate-500'
              }"></div>
              ${
                isActive && !isCooldownActive
                  ? '<div class="absolute inset-0 -m-1 rounded-full bg-cyan-400/60 animate-ping pointer-events-none"></div>'
                  : ''
              }
            </div>
          </div>
        `,
        iconSize: [56, 72],
        iconAnchor: [28, 72]
      });

      const marker = L.marker([cp.latitude, cp.longitude], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        sounds.playClick();
        if (isCompleted) {
          setMapNotice(`✓ Stage ${cp.stageNumber} Complete: You have retrieved the fragment from ${cp.characterName}!`);
          return;
        }

        if (isActive) {
          // If character is currently on 10s timeout cooldown: COMPLETELY DISABLED!
          // Player is unable to tap and restart the quiz until 10 seconds expire
          if (isCooldownActive) {
            sounds.playWrong();
            const el = marker.getElement();
            if (el) {
              el.classList.remove('marker-focus-bounce');
              void el.offsetWidth;
              el.classList.add('marker-focus-bounce');
            }
            setMapNotice(`☕ ${cp.characterName} is on break! Disabled for ${cooldownSecs}s. You are required to wait before retrying!`);
            return;
          }

          // Check if player inside geofence
          if (currentPosition) {
            const check = isInsideGeofence(
              currentPosition.latitude,
              currentPosition.longitude,
              cp.latitude,
              cp.longitude,
              cp.radiusMeters,
              boostMeters
            );
            if (check.inside) {
              onEnterCheckpoint(cp);
            } else {
              setMapNotice(`📍 You are ${check.distance}m away from ${cp.name}. Get within ${check.effectiveRadius}m to enter (or click Teleport below)!`);
            }
          } else {
            onEnterCheckpoint(cp);
          }
        }
      });

      checkpointMarkersRef.current[cp.id] = { marker, circle };
    });
  }, [checkpoints, participant.currentStage, participant.completedStages, boostMeters, currentPosition, participant.characterCooldowns, cooldownTick]);

  // Update Player Position Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentPosition) return;

    const latLng: [number, number] = [currentPosition.latitude, currentPosition.longitude];

    if (!playerMarkerRef.current) {
      // Create Player Marker
      const playerIcon = L.divIcon({
        className: 'player-radar-marker',
        html: `
          <div class="relative w-8 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span class="absolute w-10 h-10 rounded-full bg-cyan-400/30 animate-ping"></span>
            <span class="absolute w-6 h-6 rounded-full bg-cyan-500/40"></span>
            <div class="relative w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-slate-950"></div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      playerMarkerRef.current = L.marker(latLng, { icon: playerIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      playerMarkerRef.current.setLatLng(latLng);
    }

    if (!playerAccuracyCircleRef.current) {
      playerAccuracyCircleRef.current = L.circle(latLng, {
        radius: Math.max(currentPosition.accuracy || 10, 8),
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.12,
        weight: 1
      }).addTo(map);
    } else {
      playerAccuracyCircleRef.current.setLatLng(latLng);
      playerAccuracyCircleRef.current.setRadius(Math.max(currentPosition.accuracy || 10, 8));
    }
  }, [currentPosition]);

  // Recenter map on player or active checkpoint
  const handleRecenter = () => {
    sounds.playClick();
    const map = mapInstanceRef.current;
    if (!map) return;
    if (currentPosition) {
      map.flyTo([currentPosition.latitude, currentPosition.longitude], 18, { duration: 0.8 });
    } else {
      map.flyTo([activeCheckpoint.latitude, activeCheckpoint.longitude], 18, { duration: 0.8 });
    }
  };

  const handleZoomIn = () => {
    sounds.playClick();
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    sounds.playClick();
    mapInstanceRef.current?.zoomOut();
  };

  // Teleport directly to active checkpoint (GPS simulator for instant testing)
  const handleTeleportToActive = () => {
    sounds.playCorrect();
    // Put coordinates slightly inside checkpoint center (e.g. +3 meters)
    const newPos: GPSPosition = {
      latitude: activeCheckpoint.latitude + 0.00002,
      longitude: activeCheckpoint.longitude + 0.00002,
      accuracy: 5,
      timestamp: Date.now(),
      isSimulated: true
    };
    onPositionUpdate(newPos, true);

    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([newPos.latitude, newPos.longitude], 18, { duration: 0.5 });
    }
  };

  // Walk slightly closer
  const handleWalkCloser = () => {
    sounds.playClick();
    if (!currentPosition) {
      handleTeleportToActive();
      return;
    }
    // Interpolate 50% closer to active checkpoint
    const newLat = currentPosition.latitude + (activeCheckpoint.latitude - currentPosition.latitude) * 0.5;
    const newLon = currentPosition.longitude + (activeCheckpoint.longitude - currentPosition.longitude) * 0.5;

    const newPos: GPSPosition = {
      latitude: newLat,
      longitude: newLon,
      accuracy: 5,
      timestamp: Date.now(),
      isSimulated: true
    };
    onPositionUpdate(newPos, true);
  };

  // Start real browser geolocation watcher
  const handleRequestRealGps = () => {
    sounds.playClick();
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const realPos: GPSPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
          isSimulated: false
        };
        onPositionUpdate(realPos, false);
        sounds.playCorrect();
      },
      (err) => {
        setGeoError(`Location error: ${err.message}. Use Simulator Mode for testing!`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className={`relative w-full overflow-hidden shadow-2xl bg-slate-950 transition-all duration-300 animate-map-fade-in ${
      isFullscreen
        ? 'fixed inset-0 z-50 w-screen h-screen rounded-none'
        : 'h-[52vh] sm:h-[58vh] rounded-3xl border border-cyan-900/40'
    }`}>
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 transition-opacity duration-500" />

      {/* Left Corner Stack: Shortened Mission Card, Tasks List & Minimized Geo Compass */}
      <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-2 max-w-[260px] sm:max-w-[290px] pointer-events-none">
        
        {/* 1. SHORTENED TOP MISSION BOX in Left Corner */}
        <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-2 sm:p-2.5 shadow-2xl pointer-events-auto w-full transition-all">
          <div 
            onClick={() => {
              if (isActiveCooldown) {
                sounds.playWrong();
                setMapNotice(`☕ ${activeCheckpoint.characterName} is on break for another ${activeCooldownSecs}s. Cannot enter yet!`);
                return;
              }
              handleZoomToCheckpoint(activeCheckpoint);
            }}
            className="flex items-center gap-2 cursor-pointer group select-none"
            title={isActiveCooldown ? `${activeCheckpoint.characterName} is on break!` : "Click to smooth zoom to active checkpoint"}
          >
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-lg shrink-0 transition-transform shadow-inner ${
              isActiveCooldown
                ? 'bg-amber-950 border-amber-500 text-amber-300'
                : 'bg-cyan-950 border-cyan-500/40 group-hover:scale-105'
            }`}>
              {activeCheckpoint.characterAvatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black uppercase tracking-wider ${isActiveCooldown ? 'text-amber-400' : 'text-cyan-400'}`}>
                  STAGE {activeCheckpoint.stageNumber}/5
                </span>
                <span className="text-slate-400 text-[9px]">•</span>
                <span className={`text-[11px] font-bold truncate transition-colors ${
                  isActiveCooldown ? 'text-amber-300 font-extrabold' : 'text-white group-hover:text-cyan-300'
                }`}>
                  {activeCheckpoint.characterName}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium truncate">
                {isActiveCooldown ? `☕ Taking a break (${activeCooldownSecs}s left)` : activeCheckpoint.shortLocation}
              </p>
            </div>
          </div>

          {/* Distance & Action within Shortened Box */}
          <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
            {activeDistance ? (
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className={`text-[11px] font-mono font-extrabold truncate ${
                  isActiveCooldown
                    ? 'text-amber-400'
                    : activeDistance.inside
                    ? 'text-emerald-400 animate-pulse'
                    : 'text-amber-400'
                }`}>
                  {isActiveCooldown ? '☕ ON BREAK' : activeDistance.inside ? '🎯 IN GEOFENCE!' : `${activeDistance.distance}m away`}
                </span>
                <span className="text-[9px] text-slate-400 font-mono shrink-0">
                  ({activeDistance.effectiveRadius}m zone)
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400">Locating target...</span>
            )}

            {isActiveCooldown ? (
              <div
                className="px-2.5 py-1 rounded-xl bg-amber-950/95 border border-amber-500/80 text-amber-300 font-bold text-[10px] flex items-center gap-1 shadow-sm shrink-0 cursor-not-allowed select-none animate-pulse"
                title={`${activeCheckpoint.characterName} is taking a break!`}
              >
                <Coffee className="w-3 h-3 text-amber-400" />
                <span>ON BREAK (00:0{activeCooldownSecs}s)</span>
              </div>
            ) : activeDistance?.inside ? (
              <button
                onClick={() => {
                  sounds.playCorrect();
                  onEnterCheckpoint(activeCheckpoint);
                }}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-[10px] shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all shrink-0 animate-pulse"
              >
                ENTER
              </button>
            ) : null}
          </div>
        </div>

        {/* GPS mode alert if any */}
        {geoError && (
          <div className="bg-rose-950/90 backdrop-blur-md border border-rose-800 rounded-xl p-2 text-rose-200 text-xs flex items-center gap-1.5 pointer-events-auto shadow-lg w-full">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate text-[10px]">{geoError}</span>
          </div>
        )}

        {/* Map notice popup (e.g. distance warning or cooldown status) */}
        {mapNotice && (
          <div className="bg-amber-950/95 backdrop-blur-md border border-amber-500/70 rounded-xl p-2.5 text-amber-200 text-xs flex items-center justify-between gap-2 pointer-events-auto shadow-xl animate-in fade-in duration-200 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[10px] font-bold leading-tight">{mapNotice}</span>
            </div>
            <button
              onClick={() => setMapNotice(null)}
              className="text-amber-400 hover:text-amber-200 font-bold text-xs shrink-0 px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2. TASKS LIST in the Left Corner */}
        <div className="pointer-events-auto w-full bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden transition-all">
          <button
            onClick={() => {
              sounds.playClick();
              setShowTaskList(!showTaskList);
            }}
            className="w-full px-2.5 py-1.5 bg-gradient-to-r from-cyan-950 to-slate-900 border-b border-cyan-900/60 flex items-center justify-between text-left hover:bg-cyan-900/40 transition"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <ListTodo className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
                Tasks ({participant.completedStages.length}/{checkpoints.length})
              </span>
            </div>
            {showTaskList ? (
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            )}
          </button>

          {showTaskList && (
            <div className="p-1.5 space-y-1 max-h-40 overflow-y-auto text-[11px] divide-y divide-slate-800/60">
              {checkpoints.map((cp) => {
                const isCompleted = participant.completedStages.includes(cp.stageNumber);
                const isActive = cp.stageNumber === participant.currentStage;
                const isLocked = cp.stageNumber > participant.currentStage;

                // compute distance to this checkpoint
                const dist = currentPosition
                  ? calculateDistance(
                      currentPosition.latitude,
                      currentPosition.longitude,
                      cp.latitude,
                      cp.longitude
                    )
                  : null;

                return (
                  <div
                    key={cp.id}
                    onClick={() => handleZoomToCheckpoint(cp)}
                    className={`pt-1.5 pb-1 px-1.5 first:pt-1 flex items-center justify-between gap-1.5 rounded-xl cursor-pointer transition select-none group ${
                      isActive
                        ? 'bg-cyan-950/70 text-white font-bold border border-cyan-500/40 shadow-sm ring-1 ring-cyan-500/20'
                        : isCompleted
                        ? 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
                        : 'text-slate-600 hover:bg-slate-900/40 opacity-70'
                    }`}
                    title={isLocked ? `Stage ${cp.stageNumber} is locked` : `Click to smoothly zoom to ${cp.characterName}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-xs shrink-0 ${isCompleted ? 'grayscale opacity-70' : ''}`}>
                        {cp.characterAvatar}
                      </span>
                      <div className="min-w-0 truncate">
                        <div className="truncate flex items-center gap-1">
                          <span className={`text-[9px] font-mono ${isActive ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                            #{cp.stageNumber}
                          </span>
                          <span className="truncate text-[10px]">{cp.characterName}</span>
                        </div>
                        <span className="text-[8px] text-slate-500 block truncate">{cp.shortLocation}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isCompleted ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400 border border-slate-700 text-[8px] font-bold">
                          ✓ DONE
                        </span>
                      ) : (participant.characterCooldowns?.[cp.id] || 0) > Date.now() ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-500/80 text-[8px] font-bold animate-pulse flex items-center gap-0.5">
                          ☕ 00:0{Math.ceil(((participant.characterCooldowns?.[cp.id] || 0) - Date.now()) / 1000)}s
                        </span>
                      ) : isActive ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-600 text-[8px] font-bold animate-pulse">
                          {dist !== null ? `${dist}m` : 'ACTIVE'}
                        </span>
                      ) : (
                        <span className="px-1 py-0.2 rounded bg-slate-950/80 text-slate-600 text-[8px] flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. REAL-WORLD MAP GEO-LINKED COMPASS (Minimized: tap to show info) */}
        <div className="pointer-events-auto relative">
          <button
            onClick={() => {
              sounds.playClick();
              setShowCompassInfo(!showCompassInfo);
            }}
            className={`group relative flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border shadow-2xl transition-all active:scale-95 ${
              showCompassInfo ? 'border-cyan-400 ring-2 ring-cyan-500/20' : 'border-cyan-500/40 hover:border-cyan-400'
            }`}
            title="Geo-linked Compass (Tap to toggle details)"
          >
            {/* Rotating Compass Disc */}
            <div className="relative w-8 h-8 rounded-full bg-slate-900 border border-cyan-500/70 flex items-center justify-center shadow-inner shrink-0">
              {/* Cardinal Marks */}
              <span className="absolute top-0 text-[6px] font-black text-rose-400">N</span>
              <span className="absolute bottom-0 text-[6px] font-bold text-slate-500">S</span>
              <span className="absolute left-0.5 text-[6px] font-bold text-slate-500">W</span>
              <span className="absolute right-0.5 text-[6px] font-bold text-slate-500">E</span>

              {/* Live Rotated Geo Needle */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
                style={{
                  transform: `rotate(${deviceHeading !== 0 ? -deviceHeading : bearingToTarget}deg)`
                }}
              >
                <div className="w-0.5 h-3 bg-gradient-to-t from-transparent to-rose-500 rounded-t-full -translate-y-1"></div>
                <div className="w-0.5 h-3 bg-gradient-to-b from-transparent to-cyan-400 rounded-b-full translate-y-1"></div>
              </div>

              {/* Center Pivot Pin */}
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950 border border-cyan-400 z-10 shadow-sm flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-cyan-400"></div>
              </div>
            </div>

            {/* Minimized Disc Badge with quick heading & tap indicator */}
            <div className="text-left flex items-center gap-1.5 pr-1">
              <span className="text-[10px] font-bold text-slate-300">
                🧭 <span className="font-mono text-cyan-300">{deviceHeading ? `${deviceHeading}° ${getCardinal(deviceHeading)}` : `${bearingToTarget}° ${getCardinal(bearingToTarget)}`}</span>
              </span>
              <span className="text-[8px] text-cyan-400/90 bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-800">
                {showCompassInfo ? '▲ Hide' : '▼ Info'}
              </span>
            </div>
          </button>

          {/* Expanded Compass Info: ONLY shown when tapped on compass */}
          {showCompassInfo && (
            <div className="absolute left-0 top-full mt-1.5 w-60 bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-2.5 shadow-2xl z-30 animate-in fade-in zoom-in-95 text-left">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  GEO COMPASS DETAILS
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCompassInfo(false);
                  }}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="mt-2 space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Device Heading:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {deviceHeading ? `${deviceHeading}° ${getCardinal(deviceHeading)}` : 'Aligning...'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Bearing:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {bearingToTarget}° {getCardinal(bearingToTarget)}
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-800/80 text-[9px] text-slate-400 flex items-center justify-between">
                  <span>{hasCompassSupport ? '🛰️ Geo Sensor Active' : '📍 Target Bearing Locked'}</span>
                  <span className="text-cyan-400 font-medium">True North</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Floating Bar: Simulator Controls & Recenter */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        {/* Simulator controls pill */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-1.5 sm:p-2 shadow-xl pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 text-[10px] font-mono font-bold text-slate-300 border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${isSimulated ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span>{isSimulated ? 'SIMULATOR GPS' : 'REAL GPS'}</span>
          </div>

          <button
            onClick={handleTeleportToActive}
            className="px-2.5 py-1 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[11px] font-semibold transition flex items-center gap-1"
            title="Instant Teleport inside geofence for testing"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Teleport Here</span>
          </button>

          <button
            onClick={handleWalkCloser}
            className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition hidden sm:inline-flex items-center gap-1"
            title="Walk 50% closer"
          >
            <Navigation className="w-3 h-3 text-slate-400" />
            <span>Step Closer</span>
          </button>

          <button
            onClick={handleRequestRealGps}
            className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition flex items-center gap-1"
            title="Switch to Real Device GPS"
          >
            <Compass className="w-3 h-3 text-slate-400" />
            <span>Real GPS</span>
          </button>
        </div>

        {/* Right side floating controls: Zoom, Layer Switcher & Recenter */}
        <div className="flex items-center gap-1.5 relative pointer-events-auto shrink-0">
          {/* Zoom In & Out pill */}
          <div className="flex items-center rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-xl overflow-hidden divide-x divide-slate-800">
            <button
              onClick={handleZoomIn}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition active:scale-95"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition active:scale-95"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Layer switcher popup */}
          {showLayerMenu && (
            <div className="absolute bottom-12 right-10 bg-slate-900/95 backdrop-blur-md border border-cyan-800 rounded-2xl p-2 shadow-2xl w-48 space-y-1 z-30 animate-in fade-in zoom-in-95">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                Map Basemap Style
              </span>
              {(Object.keys(MAP_LAYERS) as MapTileStyle[]).map((styleId) => {
                const opt = MAP_LAYERS[styleId];
                const isSelected = selectedLayerStyle === styleId;
                return (
                  <button
                    key={styleId}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedLayerStyle(styleId);
                      setShowLayerMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-500 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.name}</span>
                    {isSelected && <span className="text-cyan-400 text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Layer switcher toggle button */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowLayerMenu(!showLayerMenu);
            }}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900/90 backdrop-blur-md border shadow-xl flex items-center justify-center transition active:scale-95 ${
              showLayerMenu ? 'border-cyan-400 text-cyan-300' : 'border-slate-700 text-slate-300 hover:text-cyan-400 hover:bg-slate-800'
            }`}
            title="Switch Map Layers (CARTO Dark, Voyager, OSM, Satellite)"
          >
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Recenter button */}
          <button
            onClick={handleRecenter}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 shadow-xl flex items-center justify-center transition active:scale-95"
            title="Recenter Map"
          >
            <Crosshair className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Map Only / Fullscreen button */}
          <button
            onClick={handleToggleFullscreen}
            className={`h-9 sm:h-10 px-2.5 sm:px-3 rounded-2xl backdrop-blur-md border shadow-xl flex items-center gap-1.5 transition active:scale-95 text-xs font-bold ${
              isFullscreen
                ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-amber-950/50'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500 hover:bg-slate-800'
            }`}
            title={isFullscreen ? "Exit Fullscreen Map View (Esc)" : "Open Map Only on Full Screen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-amber-400" />
                <span className="text-xs">Exit Map</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs hidden xs:inline">Map Only</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
