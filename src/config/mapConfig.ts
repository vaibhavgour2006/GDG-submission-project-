// CARTO Basemaps API Configuration
export const CARTO_MAP_API_KEY = "cb1_4gi9_1_6c0edc5107dce8f6ffc848b3";

export type MapTileStyle = 'carto_dark' | 'carto_voyager' | 'osm_standard' | 'satellite';

export interface TileLayerOption {
  id: MapTileStyle;
  name: string;
  url: string;
  subdomains?: string;
  maxZoom: number;
  attribution: string;
}

export const MAP_LAYERS: Record<MapTileStyle, TileLayerOption> = {
  carto_dark: {
    id: 'carto_dark',
    name: 'CARTO Dark (Cyber)',
    // CARTO requires ?key= query parameter (passing both key and api_key for maximum CDN compatibility)
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_MAP_API_KEY}&api_key=${CARTO_MAP_API_KEY}`,
    subdomains: 'abcd',
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  carto_voyager: {
    id: 'carto_voyager',
    name: 'CARTO Voyager (Clean)',
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_MAP_API_KEY}&api_key=${CARTO_MAP_API_KEY}`,
    subdomains: 'abcd',
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  osm_standard: {
    id: 'osm_standard',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
};

export const MAP_TILE_CONFIG = MAP_LAYERS.satellite;
