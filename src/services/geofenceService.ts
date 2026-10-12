import { GPSPosition } from '../types/game';

// Haversine formula to compute great-circle distance between two points in meters
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const calculateDistance = calculateHaversineDistanceMeters;

export function isInsideGeofence(
  playerLat: number,
  playerLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number,
  boostMeters: number = 0
): { inside: boolean; distance: number; effectiveRadius: number } {
  const distance = calculateHaversineDistanceMeters(playerLat, playerLon, targetLat, targetLon);
  const effectiveRadius = radiusMeters + boostMeters;
  return {
    inside: distance <= effectiveRadius,
    distance,
    effectiveRadius
  };
}

export interface GeolocationState {
  position: GPSPosition | null;
  error: string | null;
  isSimulated: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
}
