import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Checkpoint } from '../types/game';
import { sounds } from '../services/soundEffects';
import { MAP_LAYERS, MapTileStyle } from '../config/mapConfig';
import { 
  Check, 
  X, 
  Move, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  MapPin, 
  AlertCircle,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface MapPlacementPickerModalProps {
  checkpoints: Checkpoint[];
  targetCheckpointId?: string; // if opened for a specific character
  onSaveCheckpoints: (updated: Checkpoint[]) => void;
  onClose: () => void;
}

export const MapPlacementPickerModal: React.FC<MapPlacementPickerModalProps> = ({
  checkpoints,
  targetCheckpointId,
  onSaveCheckpoints,
  onClose
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, { marker: L.Marker; circle: L.Circle }>>({});

  // Working copy of checkpoints
  const [localCheckpoints, setLocalCheckpoints] = useState<Checkpoint[]>(() => 
    checkpoints.map(cp => ({ ...cp }))
  );

  const [activeSelectedId, setActiveSelectedId] = useState<string>(() => {
    if (targetCheckpointId && checkpoints.some(c => c.id === targetCheckpointId)) {
      return targetCheckpointId;
    }
    return checkpoints[0]?.id || '';
  });

  const [selectedLayerStyle, setSelectedLayerStyle] = useState<MapTileStyle>('satellite');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastMovedCpName, setLastMovedCpName] = useState<string | null>(null);

  // Active checkpoint object
  const activeCp = localCheckpoints.find(c => c.id === activeSelectedId) || localCheckpoints[0];

  // Helper: Tile layer applier
  const applyTileLayer = (map: L.Map, styleId: MapTileStyle) => {
    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
    }
    const layerCfg = MAP_LAYERS[styleId] || MAP_LAYERS.satellite;
    const tileLayer = L.tileLayer(layerCfg.url, {
      maxZoom: layerCfg.maxZoom,
      subdomains: layerCfg.subdomains || 'abc',
      attribution: layerCfg.attribution
    });
    tileLayer.addTo(map);
    activeTileLayerRef.current = tileLayer;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = activeCp ? activeCp.latitude : 22.6808;
    const initialLng = activeCp ? activeCp.longitude : 75.8790;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false
    });

    applyTileLayer(map, selectedLayerStyle);
    mapInstanceRef.current = map;

    // Click anywhere on map to reposition currently selected character directly
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!activeSelectedId) return;
      sounds.playClick();
      updateCheckpointPosition(activeSelectedId, e.latlng.lat, e.latlng.lng);
    });

    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 200),
      setTimeout(() => map.invalidateSize(), 500)
    ];

    return () => {
      timers.forEach(t => clearTimeout(t));
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    applyTileLayer(map, selectedLayerStyle);
  }, [selectedLayerStyle]);

  // Update Checkpoint Coordinate
  const updateCheckpointPosition = (id: string, lat: number, lng: number) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));

    setLocalCheckpoints(prev => {
      const target = prev.find(c => c.id === id);
      if (target) {
        setLastMovedCpName(`${target.characterAvatar} ${target.characterName}`);
      }
      return prev.map(c => c.id === id ? { ...c, latitude: roundedLat, longitude: roundedLng } : c);
    });
    setHasChanges(true);
  };

  // Synchronize Leaflet Markers with draggable = true & tap-hold
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear removed markers
    const currentIds = new Set(localCheckpoints.map(c => c.id));
    Object.entries(markersRef.current).forEach(([id, { marker, circle }]) => {
      if (!currentIds.has(id)) {
        marker.remove();
        circle.remove();
        delete markersRef.current[id];
      }
    });

    localCheckpoints.forEach(cp => {
      const isSelected = cp.id === activeSelectedId;
      const latLng: [number, number] = [cp.latitude, cp.longitude];

      // Custom Draggable Icon
      const iconHtml = `
        <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-grab active:cursor-grabbing select-none group">
          <div class="px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-lg whitespace-nowrap mb-1 border ${
            isSelected 
              ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-400/50 scale-110' 
              : 'bg-slate-900/90 text-slate-200 border-slate-700'
          } transition-transform">
            ${cp.stageNumber}. ${cp.characterName} (Drag me)
          </div>
          <div class="relative w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-2xl transition-all ${
            isSelected
              ? 'bg-amber-500/95 border-2 border-white ring-4 ring-amber-400/40 shadow-amber-500/50 scale-110 active-marker-pulse'
              : 'bg-slate-900/95 border-2 border-cyan-400 hover:scale-105'
          }">
            <span>${cp.characterAvatar}</span>
            <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-[10px] text-amber-400">
              ✥
            </div>
          </div>
          <div class="w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400 ring-2 ring-white animate-ping' : 'bg-cyan-400'} mt-1 shadow-md"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: `custom-draggable-cp-marker-${cp.id}`,
        html: iconHtml,
        iconSize: [48, 64],
        iconAnchor: [24, 64]
      });

      if (!markersRef.current[cp.id]) {
        // Create Geofence Circle
        const circle = L.circle(latLng, {
          radius: cp.radiusMeters,
          color: isSelected ? '#fbbf24' : '#06b6d4',
          fillColor: isSelected ? '#fbbf24' : '#06b6d4',
          fillOpacity: 0.2,
          weight: isSelected ? 3 : 2,
          dashArray: '6, 6'
        }).addTo(map);

        // Create Marker with DRAGGABLE: TRUE
        const marker = L.marker(latLng, {
          icon: customIcon,
          draggable: true,
          autoPan: true,
          zIndexOffset: isSelected ? 1000 : 100
        }).addTo(map);

        // Marker Drag handlers
        marker.on('dragstart', () => {
          sounds.playClick();
          setActiveSelectedId(cp.id);
        });

        marker.on('drag', (e: any) => {
          const newPos = e.target.getLatLng();
          circle.setLatLng(newPos);
        });

        marker.on('dragend', (e: any) => {
          sounds.playCorrect();
          const newPos = e.target.getLatLng();
          circle.setLatLng(newPos);
          updateCheckpointPosition(cp.id, newPos.lat, newPos.lng);
        });

        marker.on('click', () => {
          sounds.playClick();
          setActiveSelectedId(cp.id);
        });

        markersRef.current[cp.id] = { marker, circle };
      } else {
        const { marker, circle } = markersRef.current[cp.id];
        marker.setLatLng(latLng);
        marker.setIcon(customIcon);
        marker.setZIndexOffset(isSelected ? 1000 : 100);
        circle.setLatLng(latLng);
        circle.setRadius(cp.radiusMeters);
        circle.setStyle({
          color: isSelected ? '#fbbf24' : '#06b6d4',
          fillColor: isSelected ? '#fbbf24' : '#06b6d4',
          weight: isSelected ? 3 : 2
        });
      }
    });
  }, [localCheckpoints, activeSelectedId]);

  // Center on currently selected checkpoint
  const handleFocusSelected = (id: string) => {
    sounds.playClick();
    setActiveSelectedId(id);
    const target = localCheckpoints.find(c => c.id === id);
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target.latitude, target.longitude], 18, { duration: 0.6 });
    }
  };

  const handleSave = () => {
    sounds.playCorrect();
    onSaveCheckpoints(localCheckpoints);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[92vh] bg-slate-900 border-2 border-amber-500/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Top Header Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-xl text-amber-400">
              <Move className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                  Place & Move Characters on Map
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-mono font-bold">
                  TAP & DRAG
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tap and hold any character icon on the satellite map to drag them to a new campus position, or tap anywhere on the map to place!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg transition active:scale-95 ${
                hasChanges
                  ? 'bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 animate-pulse'
                  : 'bg-emerald-500 text-slate-950'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{hasChanges ? 'Apply & Save GPS' : 'Done'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Character Quick Switcher Ribbon */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Characters:
          </span>
          {localCheckpoints.map(cp => {
            const isSelected = cp.id === activeSelectedId;
            return (
              <button
                key={cp.id}
                onClick={() => handleFocusSelected(cp.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-white/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{cp.characterAvatar}</span>
                <span>Stage {cp.stageNumber}: {cp.characterName}</span>
              </button>
            );
          })}
        </div>

        {/* Map Body Area */}
        <div className="relative flex-1 w-full h-full overflow-hidden animate-map-fade-in">
          <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

          {/* Floating Instructions Banner */}
          <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 pointer-events-none">
            <div className="bg-slate-950/90 backdrop-blur-md border border-amber-500/40 rounded-2xl p-2.5 sm:p-3 shadow-xl pointer-events-auto flex items-center gap-2.5 max-w-md">
              <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-500/50 flex items-center justify-center text-lg shrink-0">
                {activeCp?.characterAvatar || '📍'}
              </div>
              <div className="min-w-0 text-xs">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>Selected: {activeCp?.characterName}</span>
                  <span className="text-[10px] text-amber-400 font-mono">({activeCp?.shortLocation})</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Lat: {activeCp?.latitude.toFixed(6)}, Lng: {activeCp?.longitude.toFixed(6)} • Radius: {activeCp?.radiusMeters}m
                </div>
              </div>
            </div>
          </div>

          {/* Moved Notice Toast */}
          {lastMovedCpName && (
            <div className="absolute top-16 left-3 z-10 pointer-events-none animate-in fade-in slide-in-from-top-2">
              <div className="bg-emerald-950/90 backdrop-blur-md border border-emerald-500 text-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-xl">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Updated coordinates for {lastMovedCpName}!</span>
              </div>
            </div>
          )}

          {/* Bottom Floating Map Controls (Zoom & Satellite Layer) */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
            {/* Layer switcher menu */}
            {showLayerMenu && (
              <div className="absolute bottom-12 right-0 bg-slate-900/95 backdrop-blur-md border border-cyan-800 rounded-2xl p-2 shadow-2xl w-48 space-y-1 z-30">
                {(Object.keys(MAP_LAYERS) as MapTileStyle[]).map(styleId => (
                  <button
                    key={styleId}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedLayerStyle(styleId);
                      setShowLayerMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                      selectedLayerStyle === styleId
                        ? 'bg-amber-950 text-amber-200 border border-amber-500 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{MAP_LAYERS[styleId].name}</span>
                    {selectedLayerStyle === styleId && <span className="text-amber-400">✓</span>}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                sounds.playClick();
                setShowLayerMenu(!showLayerMenu);
              }}
              className="w-10 h-10 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-amber-400 shadow-xl flex items-center justify-center transition active:scale-95"
              title="Switch Map Layers (Default Satellite)"
            >
              <Layers className="w-4 h-4" />
            </button>

            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="w-10 h-10 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-cyan-400 shadow-xl flex items-center justify-center transition active:scale-95"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="w-10 h-10 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-cyan-400 shadow-xl flex items-center justify-center transition active:scale-95"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Helper Bar */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>💡 <b>Tip:</b> Tap any character pin and drag it anywhere on the campus, or simply click on the map to instantly jump the character to that point.</span>
          </div>
          <span className="font-mono text-slate-500 text-[11px]">
            {localCheckpoints.length} Characters Placed
          </span>
        </div>

      </div>
    </div>
  );
};
