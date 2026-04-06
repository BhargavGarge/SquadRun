// ─────────────────────────────────────────────────────────────
// Segment detection — auto-identify best pace segments in a route
// Divides route into 1km/5km/10km chunks, calculates pace for each
// ─────────────────────────────────────────────────────────────

import type { RouteCoord } from "../types";

export interface WorkoutSegment {
  id: string; // Unique ID for this segment (e.g., "seg-start-end-distance")
  distanceKm: number; // How many km this segment is
  startIndex: number; // Start coordinate index
  endIndex: number; // End coordinate index
  durationSeconds: number; // Time taken for this segment
  paceMinPerKm: number; // Pace in minutes per km
  averageSpeed: number; // km/h for cycling
  isPR?: boolean; // Is this a personal record on this distance?
}

const HAVERSINE_R_KM = 6371;

/**
 * Calculate distance between two coordinates in kilometers
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return HAVERSINE_R_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Build cumulative distance array for the route
 */
function buildDistanceArray(coords: RouteCoord[]): number[] {
  const distances = [0];
  for (let i = 1; i < coords.length; i++) {
    const d = haversineKm(
      coords[i - 1].latitude,
      coords[i - 1].longitude,
      coords[i].latitude,
      coords[i].longitude,
    );
    distances.push(distances[distances.length - 1] + d);
  }
  return distances;
}

/**
 * Auto-detect segments by dividing route into fixed-distance chunks
 * Returns segments of 1km, 5km, and 10km that fit within the route
 */
export function detectSegments(
  route: RouteCoord[],
  workoutType: string = "run",
): WorkoutSegment[] {
  if (route.length < 2) return [];

  const distances = buildDistanceArray(route);
  const totalDistance = distances[distances.length - 1];
  const segments: WorkoutSegment[] = [];

  // Segment targets: 1km, 5km, 10km
  const segmentTargets = [1, 5, 10];

  for (const target of segmentTargets) {
    // Find all segments of this distance that fit in the route
    let startDist = 0;

    while (startDist + target <= totalDistance) {
      const endDist = startDist + target;

      // Find start and end indices
      let startIdx = 0;
      let endIdx = route.length - 1;

      for (let i = 0; i < distances.length; i++) {
        if (distances[i] >= startDist && startIdx === 0) startIdx = i;
        if (distances[i] >= endDist) {
          endIdx = i;
          break;
        }
      }

      // Calculate duration for this segment
      const startTime = route[startIdx].timestamp ?? Date.now();
      const endTime = route[endIdx].timestamp ?? Date.now();
      const durationSeconds = (endTime - startTime) / 1000;

      // Only include if we have valid time data (at least 1 second)
      if (durationSeconds >= 1) {
        const paceMinPerKm = durationSeconds / 60 / target;
        const averageSpeed = target / (durationSeconds / 3600); // km/h

        segments.push({
          id: `seg-${Math.round(startDist)}-${Math.round(endDist)}-${target}`,
          distanceKm: target,
          startIndex: startIdx,
          endIndex: endIdx,
          durationSeconds: Math.round(durationSeconds),
          paceMinPerKm: parseFloat(paceMinPerKm.toFixed(2)),
          averageSpeed: parseFloat(averageSpeed.toFixed(1)),
          isPR: false, // Will be updated by caller when comparing with history
        });
      }

      startDist += target;
    }
  }

  return segments;
}

/**
 * Calculate pace string from segment
 */
export function formatSegmentPace(
  segment: WorkoutSegment,
  workoutType: string = "run",
): string {
  if (workoutType === "cycle" || workoutType === "swim") {
    return `${segment.averageSpeed.toFixed(1)} km/h`;
  }

  const min = Math.floor(segment.paceMinPerKm);
  const sec = Math.round((segment.paceMinPerKm % 1) * 60);
  return `${min}:${String(sec).padStart(2, "0")}/km`;
}

/**
 * Get coordinates for a specific segment
 */
export function getSegmentCoords(
  route: RouteCoord[],
  segment: WorkoutSegment,
): RouteCoord[] {
  return route.slice(segment.startIndex, segment.endIndex + 1);
}

/**
 * Extract segment data for database storage
 */
export function getSegmentData(
  route: RouteCoord[],
  segment: WorkoutSegment,
) {
  const startCoord = route[segment.startIndex];
  const endCoord = route[segment.endIndex];

  return {
    distanceKm: segment.distanceKm,
    startLat: startCoord.latitude,
    startLon: startCoord.longitude,
    endLat: endCoord.latitude,
    endLon: endCoord.longitude,
    durationSeconds: segment.durationSeconds,
    paceMinPerKm: segment.paceMinPerKm,
  };
}
