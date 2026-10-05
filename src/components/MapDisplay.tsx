import React from 'react';
import { Trip, TripStop } from '../types';
import { MapPin, Truck, CheckCircle2, Store, Warehouse } from 'lucide-react';

interface MapDisplayProps {
  trip?: Trip;
  highlightStopId?: string;
  className?: string;
}

export const MapDisplay: React.FC<MapDisplayProps> = ({ trip, highlightStopId, className = '' }) => {
  if (!trip) {
    return (
      <div className={`bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 border border-slate-200 ${className}`}>
        <MapPin className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm font-medium">Select a trip to view route map</p>
      </div>
    );
  }

  // Generate SVG coordinates based on lat/lng normalized inside the bounding box
  const allPoints = [
    { name: 'Pickup: ' + trip.pickupAddress, lat: trip.pickupLat, lng: trip.pickupLng, isPickup: true, status: 'pickup' },
    ...trip.stops.map((s) => ({
      name: `Stop ${s.sequenceNumber}: ${s.shopName}`,
      lat: s.lat,
      lng: s.lng,
      isPickup: false,
      stop: s,
      status: s.status,
    })),
  ];

  const minLat = Math.min(...allPoints.map((p) => p.lat));
  const maxLat = Math.max(...allPoints.map((p) => p.lat));
  const minLng = Math.min(...allPoints.map((p) => p.lng));
  const maxLng = Math.max(...allPoints.map((p) => p.lng));

  const latSpan = maxLat - minLat || 0.01;
  const lngSpan = maxLng - minLng || 0.01;

  // Map lat/lng to svg viewBox (0,0 to 600, 360) with padding
  const padding = 50;
  const width = 600;
  const height = 340;

  const toSvgX = (lng: number) => padding + ((lng - minLng) / lngSpan) * (width - 2 * padding);
  const toSvgY = (lat: number) => height - padding - ((lat - minLat) / latSpan) * (height - 2 * padding);

  const pickupPos = { x: toSvgX(trip.pickupLng), y: toSvgY(trip.pickupLat) };
  const stopPositions = trip.stops.map((s) => ({
    stop: s,
    x: toSvgX(s.lng),
    y: toSvgY(s.lat),
  }));

  // Route path polyline
  const pathPoints = [pickupPos, ...stopPositions];
  const pathD = pathPoints.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  // Calculate simulated driver vehicle location along route
  let driverPos = pickupPos;
  const activeStopIndex = trip.stops.findIndex((s) => s.status === 'en_route' || s.status === 'arrived');
  if (activeStopIndex >= 0) {
    const prevPos = activeStopIndex === 0 ? pickupPos : stopPositions[activeStopIndex - 1];
    const targetPos = stopPositions[activeStopIndex];
    if (trip.stops[activeStopIndex].status === 'arrived') {
      driverPos = targetPos;
    } else {
      // Midway between prev and target
      driverPos = {
        x: (prevPos.x + targetPos.x) / 2,
        y: (prevPos.y + targetPos.y) / 2,
      };
    }
  } else if (trip.status === 'completed' && stopPositions.length > 0) {
    driverPos = stopPositions[stopPositions.length - 1];
  }

  return (
    <div className={`relative bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800 ${className}`}>
      {/* Route Info Badge */}
      <div className="absolute top-3 left-3 z-10 bg-slate-800/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold">{trip.id}</span>
        </div>
        <span className="text-slate-500">|</span>
        <span>{trip.estimatedDistanceKm} km</span>
        <span className="text-slate-500">|</span>
        <span>{trip.totalStops} Retail Stops</span>
      </div>

      {/* SVG Canvas Map */}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
        {/* Subtle grid lines simulating city map roads */}
        <defs>
          <pattern id="city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#city-grid)" />

        {/* Road glow backdrop */}
        <path d={pathD} fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Route Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3.5"
          strokeDasharray="6 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-[pulse_3s_ease-in-out_infinite]"
        />

        {/* Completed segment line if stops delivered */}
        {trip.stops
          .filter((s) => s.status === 'delivered')
          .map((s, idx) => {
            const start = idx === 0 ? pickupPos : stopPositions[idx - 1];
            const end = stopPositions[idx];
            return (
              <line
                key={`delivered-line-${s.id}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
              />
            );
          })}

        {/* Pickup Marker */}
        <g transform={`translate(${pickupPos.x}, ${pickupPos.y})`}>
          <circle r="14" fill="#f59e0b" fillOpacity="0.25" />
          <circle r="9" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
          <text y="24" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="600">
            WH Depot
          </text>
        </g>

        {/* Stop Markers */}
        {stopPositions.map((pos) => {
          const isDelivered = pos.stop.status === 'delivered';
          const isCurrent = pos.stop.status === 'en_route' || pos.stop.status === 'arrived';
          const isHighlighted = highlightStopId === pos.stop.id;

          const fillColor = isDelivered ? '#10b981' : isCurrent ? '#f59e0b' : '#64748b';

          return (
            <g key={pos.stop.id} transform={`translate(${pos.x}, ${pos.y})`}>
              {isHighlighted && <circle r="18" fill={fillColor} fillOpacity="0.3" className="animate-ping" />}
              <circle r={isCurrent ? 12 : 9} fill={fillColor} stroke="#ffffff" strokeWidth="2" />
              <text y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                {pos.stop.sequenceNumber}
              </text>
              <text y="24" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="500">
                {pos.stop.shopName.length > 14 ? pos.stop.shopName.slice(0, 12) + '…' : pos.stop.shopName}
              </text>
            </g>
          );
        })}

        {/* Driver Auto Vehicle Marker */}
        {trip.driverId && (
          <g transform={`translate(${driverPos.x}, ${driverPos.y})`}>
            <circle r="16" fill="#2563eb" fillOpacity="0.3" className="animate-ping" />
            <circle r="11" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
            <circle r="4" fill="#ffffff" />
          </g>
        )}
      </svg>

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 z-10 bg-slate-800/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Pickup</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Delivered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span>Auto Driver</span>
        </div>
      </div>
    </div>
  );
};
