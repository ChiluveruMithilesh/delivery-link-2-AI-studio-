import React, { useState, useEffect, useRef } from 'react';
import { TripStop, PersonalizedRoutePlan } from '../types';
import {
  Navigation,
  MapPin,
  Play,
  Pause,
  RotateCcw,
  Compass,
  Gauge,
  Store,
  Layers,
  Crosshair,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface GoogleMapViewProps {
  pickup: {
    lat: number;
    lng: number;
    address: string;
    label?: string;
  };
  stops: TripStop[];
  routePlan?: PersonalizedRoutePlan;
  currentDriverLat?: number;
  currentDriverLng?: number;
  activeStopIndex?: number;
  onDriverLocationUpdate?: (lat: number, lng: number, speed: number) => void;
  showSimControls?: boolean;
  heightClass?: string;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  pickup,
  stops,
  routePlan,
  currentDriverLat,
  currentDriverLng,
  activeStopIndex = 0,
  onDriverLocationUpdate,
  showSimControls = true,
  heightClass = 'h-96',
}) => {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'streets' | 'satellite' | 'transit'>('streets');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 4>(2);
  const [simProgress, setSimProgress] = useState(0); // 0 to 1 along total route
  const [useRealGps, setUseRealGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number; speed: number }>({
    lat: currentDriverLat || pickup.lat,
    lng: currentDriverLng || pickup.lng,
    speed: 0,
  });

  const animFrameRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Sync external driver coords if provided
  useEffect(() => {
    if (currentDriverLat && currentDriverLng && !isSimulating && !useRealGps) {
      setDriverPos((prev) => ({
        ...prev,
        lat: currentDriverLat,
        lng: currentDriverLng,
      }));
    }
  }, [currentDriverLat, currentDriverLng, isSimulating, useRealGps]);

  // Real GPS tracking via navigator.geolocation
  useEffect(() => {
    if (useRealGps && 'geolocation' in navigator) {
      setGpsError(null);
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const speed = Math.round((position.coords.speed || 0) * 3.6);
          setDriverPos({ lat, lng, speed });
          if (onDriverLocationUpdate) {
            onDriverLocationUpdate(lat, lng, speed);
          }
        },
        (err) => {
          setGpsError(err.message || 'GPS location access denied or unavailable in this window.');
          setUseRealGps(false);
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
      watchIdRef.current = id;
    } else if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [useRealGps, onDriverLocationUpdate]);

  // Points list: [Pickup (Place A), Stop 1 (Place B), Stop 2 (Place C)...]
  const allWaypoints = [
    {
      id: 'godown',
      label: pickup.label || 'Place A',
      code: 'GODOWN',
      name: pickup.address.split(',')[0],
      address: pickup.address,
      lat: pickup.lat,
      lng: pickup.lng,
      isPickup: true,
      items: 'Pickup & Loading Point',
    },
    ...stops.map((s, idx) => ({
      id: s.id,
      label: s.placeLabel || `Place ${String.fromCharCode(66 + idx)}`,
      code: s.shopkeeperCode,
      name: s.shopName,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      isPickup: false,
      items: s.itemsDescription || `${s.quantity} ${s.unitType}`,
      phone: s.shopkeeperPhone,
      status: s.status,
      otp: s.deliveryOtp,
    })),
  ];

  // Simulation engine along the waypoints
  useEffect(() => {
    if (!isSimulating || allWaypoints.length < 2) return;

    let startTime = performance.now();
    const totalLegs = allWaypoints.length - 1;
    // Base duration: 18 seconds per stop leg at 1x
    const totalDuration = (totalLegs * 14000) / simSpeed;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      let nextProgress = elapsed / totalDuration;

      if (nextProgress >= 1) {
        nextProgress = 1;
        setIsSimulating(false);
      }

      setSimProgress(nextProgress);

      // Determine current leg
      const legIndex = Math.min(Math.floor(nextProgress * totalLegs), totalLegs - 1);
      const legFrac = (nextProgress * totalLegs) - legIndex;

      const p1 = allWaypoints[legIndex];
      const p2 = allWaypoints[legIndex + 1];

      if (p1 && p2) {
        const curLat = p1.lat + (p2.lat - p1.lat) * legFrac;
        const curLng = p1.lng + (p2.lng - p1.lng) * legFrac;
        const speedKmh = 24 + Math.sin(legFrac * Math.PI) * 12;

        setDriverPos({
          lat: Number(curLat.toFixed(6)),
          lng: Number(curLng.toFixed(6)),
          speed: Math.round(speedKmh),
        });

        if (onDriverLocationUpdate) {
          onDriverLocationUpdate(curLat, curLng, Math.round(speedKmh));
        }
      }

      if (nextProgress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimulating, simSpeed, allWaypoints.length]);

  // Compute map bounds for projection
  const lats = allWaypoints.map((p) => p.lat);
  const lngs = allWaypoints.map((p) => p.lng);
  const minLat = Math.min(...lats, driverPos.lat) - 0.008;
  const maxLat = Math.max(...lats, driverPos.lat) + 0.008;
  const minLng = Math.min(...lngs, driverPos.lng) - 0.008;
  const maxLng = Math.max(...lngs, driverPos.lng) + 0.008;

  // Coordinate projection from GPS (lat, lng) to SVG (width: 100%, viewBox: 1000 x 600)
  const projectX = (lng: number) => {
    const range = maxLng - minLng || 0.01;
    return 60 + ((lng - minLng) / range) * 880;
  };
  const projectY = (lat: number) => {
    const range = maxLat - minLat || 0.01;
    return 540 - ((lat - minLat) / range) * 480;
  };

  // Generate SVG polyline points string
  const polylinePoints = allWaypoints
    .map((wp) => `${projectX(wp.lng)},${projectY(wp.lat)}`)
    .join(' ');

  const activeStop = stops[activeStopIndex] || stops[0];

  return (
    <div className={`relative bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-700/60 ${heightClass} flex flex-col`}>
      {/* Top Map Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Badges: Place Count & Active Route Info */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-white text-xs">
          <span className="flex items-center gap-1.5 font-bold text-amber-400">
            <Compass className="w-4 h-4" />
            Google Maps GPS
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-medium">
            {allWaypoints.length} Locations (Place A to {allWaypoints[allWaypoints.length - 1]?.label || 'Place ?'})
          </span>
          {routePlan && (
            <>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-semibold">{routePlan.totalDistanceKm} km Total</span>
            </>
          )}
        </div>

        {/* Right Controls: Map Layers & GPS Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Map Layer Mode */}
          <div className="flex bg-slate-900/90 backdrop-blur-md rounded-xl p-0.5 border border-slate-700/80 shadow-lg">
            <button
              onClick={() => setMapType('streets')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                mapType === 'streets' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Streets
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                mapType === 'satellite' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Device GPS Toggle */}
          <button
            onClick={() => {
              if (isSimulating) setIsSimulating(false);
              setUseRealGps(!useRealGps);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border shadow-lg transition ${
              useRealGps
                ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Live Device GPS Location"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{useRealGps ? 'GPS Active' : 'Live GPS'}</span>
          </button>
        </div>
      </div>

      {/* GPS Error Banner */}
      {gpsError && (
        <div className="absolute top-14 left-3 right-3 z-30 bg-rose-950/90 border border-rose-800 text-rose-200 text-xs px-3 py-1.5 rounded-xl flex items-center justify-between">
          <span>{gpsError}</span>
          <button onClick={() => setGpsError(null)} className="text-xs underline text-rose-300 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Interactive Vector Map Container */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden">
        {/* Background Grid / Street Tile styling */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            mapType === 'satellite'
              ? 'bg-[#15222e] opacity-95'
              : 'bg-[#0f172a]'
          }`}
          style={{
            backgroundImage:
              mapType === 'satellite'
                ? 'radial-gradient(#1e3a5f 1px, transparent 1px), radial-gradient(#1e293b 1px, #0b1322 1px)'
                : 'linear-gradient(to right, #1e293b15 1px, transparent 1px), linear-gradient(to bottom, #1e293b15 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* SVG Route Paths & Coordinates Canvas */}
        <svg
          className="w-full h-full absolute inset-0 pointer-events-none"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle Hyderabad Roads Grid Graphic */}
          <g stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.4">
            <line x1="80" y1="200" x2="920" y2="200" />
            <line x1="120" y1="380" x2="880" y2="380" />
            <line x1="300" y1="80" x2="300" y2="520" />
            <line x1="680" y1="80" x2="680" y2="520" />
            <circle cx="500" cy="300" r="160" fill="none" strokeWidth="0.8" />
          </g>

          {/* Route Polyline - Glowing Background */}
          <polyline
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="8"
            strokeOpacity="0.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Route Polyline - Primary Road Line */}
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="8 4"
            points={polylinePoints}
          />

          {/* Driver to Waypoint Line when GPS active */}
          <line
            x1={projectX(driverPos.lng)}
            y1={projectY(driverPos.lat)}
            x2={projectX(activeStop?.lng || pickup.lng)}
            y2={projectY(activeStop?.lat || pickup.lat)}
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="3 3"
            opacity="0.8"
          />
        </svg>

        {/* Map HTML Markers */}
        <div className="absolute inset-0 pointer-events-auto">
          {allWaypoints.map((wp, idx) => {
            const isGodown = wp.isPickup;
            const isSelected = selectedStopId === wp.id;
            const x = projectX(wp.lng);
            const y = projectY(wp.lat);

            return (
              <div
                key={wp.id}
                style={{
                  left: `${(x / 1000) * 100}%`,
                  top: `${(y / 600) * 100}%`,
                  transform: 'translate(-50%, -100%)',
                }}
                className="absolute z-10 transition-transform duration-200 cursor-pointer group"
                onClick={() => setSelectedStopId(wp.id === selectedStopId ? null : wp.id)}
              >
                {/* Marker Pin Visual */}
                <div
                  className={`flex items-center justify-center rounded-full shadow-xl transition-all ${
                    isGodown
                      ? 'w-10 h-10 bg-emerald-600 text-white ring-4 ring-emerald-400/30'
                      : isSelected
                      ? 'w-9 h-9 bg-amber-500 text-slate-900 ring-4 ring-amber-300 scale-110 font-extrabold'
                      : wp.status === 'delivered'
                      ? 'w-8 h-8 bg-emerald-700 text-emerald-100 ring-2 ring-emerald-500/40'
                      : 'w-8 h-8 bg-blue-600 text-white ring-2 ring-blue-400/40 hover:scale-110'
                  }`}
                >
                  {isGodown ? (
                    <span className="text-xs font-black">A</span>
                  ) : wp.status === 'delivered' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-[11px] font-bold">{wp.label.replace('Place ', '')}</span>
                  )}
                </div>

                {/* Always-Visible Label Pill for Quick Scanning */}
                <div className="mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[10px] font-mono whitespace-nowrap shadow-md border border-slate-700 max-w-[110px] truncate text-center">
                  {wp.code}
                </div>

                {/* Detailed Hover / Click Tooltip Popup */}
                {isSelected && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                      <span className="font-bold text-amber-400 text-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {wp.label}
                      </span>
                      <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                        {wp.code}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-white leading-tight mb-1">{wp.name}</div>
                    <div className="text-[11px] text-slate-400 mb-2 leading-snug">{wp.address}</div>
                    <div className="bg-slate-800/80 p-1.5 rounded-lg text-[11px] text-slate-300 border border-slate-700/60">
                      <span className="text-amber-300 font-semibold">Items: </span>
                      {wp.items}
                    </div>
                    {wp.phone && (
                      <div className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Phone: {wp.phone}</span>
                        {wp.otp && <span className="text-emerald-400 font-mono font-bold">OTP: {wp.otp}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Live Driver Auto Rickshaw GPS Marker */}
          <div
            style={{
              left: `${(projectX(driverPos.lng) / 1000) * 100}%`,
              top: `${(projectY(driverPos.lat) / 600) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-30 transition-all duration-300 pointer-events-none"
          >
            {/* Radar Pulsing Rings */}
            <div className="absolute inset-0 -m-3 rounded-full bg-amber-500/30 animate-ping" />
            <div className="relative w-11 h-11 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xl ring-4 ring-amber-300/50">
              <span className="text-lg select-none">🛺</span>
            </div>
            {/* Live GPS Telemetry Pill */}
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] whitespace-nowrap shadow-lg flex items-center gap-1 border border-amber-300">
              <Gauge className="w-3 h-3" />
              <span>{driverPos.speed} km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar: Driving Simulator & Live GPS Status */}
      {showSimControls && (
        <div className="bg-slate-900/95 border-t border-slate-800 p-2.5 px-4 z-20 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Driver Telemetry Info */}
          <div className="flex items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-slate-400">Driver GPS:</span>
              <span className="font-mono text-white">
                {driverPos.lat.toFixed(4)}, {driverPos.lng.toFixed(4)}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-slate-400">Speed:</span>
              <span className="font-semibold text-amber-400">{driverPos.speed} km/h</span>
            </div>
            {activeStop && (
              <div className="hidden md:flex items-center gap-1.5">
                <span className="text-slate-400">Next Target:</span>
                <span className="font-medium text-white truncate max-w-[160px]">
                  {activeStop.placeLabel || 'Stop'} • {activeStop.shopName}
                </span>
              </div>
            )}
          </div>

          {/* Rapido Auto Driving Simulator Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden lg:inline">Auto Route Drive Sim:</span>
            <button
              onClick={() => {
                if (useRealGps) setUseRealGps(false);
                setIsSimulating(!isSimulating);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition text-xs shadow-xs ${
                isSimulating
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? 'Pause Drive' : 'Simulate Drive'}</span>
            </button>

            {/* Speed Multiplier */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              {([1, 2, 4] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  className={`px-2 py-1 text-[10px] font-bold rounded ${
                    simSpeed === spd ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Reset Sim Button */}
            <button
              onClick={() => {
                setIsSimulating(false);
                setSimProgress(0);
                setDriverPos({
                  lat: pickup.lat,
                  lng: pickup.lng,
                  speed: 0,
                });
              }}
              title="Reset Driver Position to Place A (Godown)"
              className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Attribution Requirement for Google Maps */}
      <div className="absolute bottom-1 right-2 text-[9px] text-slate-500/80 pointer-events-none select-none z-10">
        Google Maps
      </div>
    </div>
  );
};
