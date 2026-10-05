import { TripStop, PersonalizedRoutePlan, PersonalizedRouteLeg } from '../types';

// Convert degrees to radians
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Calculate realistic urban driving distance in km (Haversine * 1.32 road winding factor)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  // Realistic urban road factor
  return Number((straightLine * 1.32).toFixed(1));
}

// Convert stop index into letters: 0 -> Place A (Godown), 1 -> Place B, 2 -> Place C ... 25 -> Place Z, 26 -> Place AA
export function getPlaceLabel(index: number): string {
  if (index === 0) return 'Place A';
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const shifted = index;
  if (shifted < 26) {
    return `Place ${alphabet[shifted]}`;
  }
  const first = Math.floor(shifted / 26) - 1;
  const second = shifted % 26;
  return `Place ${alphabet[first]}${alphabet[second]}`;
}

export interface OptimizationResult {
  optimizedStops: TripStop[];
  routePlan: PersonalizedRoutePlan;
}

/**
 * Optimizes the route using Nearest Neighbor + 2-opt heuristic
 * to find the minimum distance path through all shops starting from the pickup godown.
 */
export function optimizeRoutePlan(
  pickupLat: number,
  pickupLng: number,
  pickupAddress: string,
  stops: TripStop[]
): OptimizationResult {
  if (stops.length === 0) {
    return {
      optimizedStops: [],
      routePlan: {
        totalDistanceKm: 0,
        totalDurationMin: 0,
        legs: [],
      },
    };
  }

  // 1. Calculate unoptimized distance (original order)
  let unoptDist = 0;
  let currLat = pickupLat;
  let currLng = pickupLng;
  for (const s of stops) {
    unoptDist += calculateDistanceKm(currLat, currLng, s.lat, s.lng);
    currLat = s.lat;
    currLng = s.lng;
  }
  unoptDist = Number(unoptDist.toFixed(1));

  // 2. Nearest Neighbor TSP algorithm starting from Godown (Place A)
  const remaining = [...stops];
  const orderedStops: TripStop[] = [];
  let lastLat = pickupLat;
  let lastLng = pickupLng;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistanceKm(lastLat, lastLng, remaining[i].lat, remaining[i].lng);
      if (dist < minDistance) {
        minDistance = dist;
        bestIndex = i;
      }
    }

    const nextStop = remaining.splice(bestIndex, 1)[0];
    orderedStops.push(nextStop);
    lastLat = nextStop.lat;
    lastLng = nextStop.lng;
  }

  // 3. 2-opt refinement for smaller sets (<= 30) to untangle any crossing paths
  if (orderedStops.length > 3 && orderedStops.length <= 35) {
    let improved = true;
    let iterations = 0;
    while (improved && iterations < 30) {
      improved = false;
      iterations++;
      for (let i = 0; i < orderedStops.length - 1; i++) {
        for (let k = i + 1; k < orderedStops.length; k++) {
          const prevLat = i === 0 ? pickupLat : orderedStops[i - 1].lat;
          const prevLng = i === 0 ? pickupLng : orderedStops[i - 1].lng;
          const nextLat = k === orderedStops.length - 1 ? orderedStops[k].lat : orderedStops[k + 1].lat;
          const nextLng = k === orderedStops.length - 1 ? orderedStops[k].lng : orderedStops[k + 1].lng;

          const currentDist =
            calculateDistanceKm(prevLat, prevLng, orderedStops[i].lat, orderedStops[i].lng) +
            calculateDistanceKm(orderedStops[k].lat, orderedStops[k].lng, nextLat, nextLng);

          const newDist =
            calculateDistanceKm(prevLat, prevLng, orderedStops[k].lat, orderedStops[k].lng) +
            calculateDistanceKm(orderedStops[i].lat, orderedStops[i].lng, nextLat, nextLng);

          if (newDist < currentDist - 0.2) {
            // Reverse order from i to k
            const reversed = orderedStops.slice(i, k + 1).reverse();
            orderedStops.splice(i, reversed.length, ...reversed);
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
  }

  // 4. Build Leg-by-Leg Personalized Route Plan (Rapido style)
  const legs: PersonalizedRouteLeg[] = [];
  let totalOptimizedKm = 0;
  let fromLabel = 'Place A';
  let fromName = pickupAddress.split(',')[0] || 'Distributor Godown';
  let prevPointLat = pickupLat;
  let prevPointLng = pickupLng;

  const finalStops: TripStop[] = orderedStops.map((stop, idx) => {
    const stopNumber = idx + 1;
    const toLabel = getPlaceLabel(stopNumber);
    const legDist = calculateDistanceKm(prevPointLat, prevPointLng, stop.lat, stop.lng);
    totalOptimizedKm += legDist;
    // Auto speed in city ~ 20-25 km/h + 3 min per stop handling
    const legDurationMin = Math.max(3, Math.round((legDist / 22) * 60) + 2);

    legs.push({
      fromLabel,
      fromName,
      toLabel,
      toName: stop.shopName,
      toCode: stop.shopkeeperCode,
      distanceKm: legDist,
      durationMin: legDurationMin,
      instructions: `Drive towards ${stop.shopName} (${stop.address.split(',')[0]}). Distance: ${legDist} km (~${legDurationMin} min).`,
    });

    fromLabel = toLabel;
    fromName = stop.shopName;
    prevPointLat = stop.lat;
    prevPointLng = stop.lng;

    return {
      ...stop,
      sequenceNumber: stopNumber,
      placeLabel: toLabel,
      distanceFromPrevKm: legDist,
    };
  });

  totalOptimizedKm = Number(totalOptimizedKm.toFixed(1));
  const totalDurationMin = Math.round((totalOptimizedKm / 20) * 60) + finalStops.length * 4;
  const distanceSaved = Number(Math.max(0, unoptDist - totalOptimizedKm).toFixed(1));
  const timeSaved = Math.round(distanceSaved * 2.8);

  const routePlan: PersonalizedRoutePlan = {
    totalDistanceKm: totalOptimizedKm,
    totalDurationMin,
    unoptimizedDistanceKm: unoptDist,
    distanceSavedKm: distanceSaved,
    timeSavedMin: timeSaved,
    legs,
  };

  return {
    optimizedStops: finalStops,
    routePlan,
  };
}
