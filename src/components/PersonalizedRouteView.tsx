import React from 'react';
import { PersonalizedRoutePlan, TripStop } from '../types';
import {
  Route,
  Zap,
  Clock,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  ArrowRight,
  PackageCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  FileCheck2,
} from 'lucide-react';

interface PersonalizedRouteViewProps {
  routePlan?: PersonalizedRoutePlan;
  stops: TripStop[];
  pickupAddress: string;
  activeStopIndex?: number;
  onSelectStop?: (index: number) => void;
  title?: string;
  isDriverView?: boolean;
}

export const PersonalizedRouteView: React.FC<PersonalizedRouteViewProps> = ({
  routePlan,
  stops,
  pickupAddress,
  activeStopIndex = 0,
  onSelectStop,
  title = 'Personalized Route Plan (Rapido Minimum Distance)',
  isDriverView = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (!routePlan || stops.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        <Route className="w-8 h-8 mx-auto mb-2 text-slate-500" />
        <p className="text-sm font-medium">Add shopkeeper codes to generate a personalized route plan.</p>
      </div>
    );
  }

  const hasSavings = (routePlan.distanceSavedKm || 0) > 0.1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Plan Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-white text-base">{title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tailored minimum-distance sequence calculated from Place A (Godown) across {stops.length} shop stops.
          </p>
        </div>

        {/* Stats Pill Badges */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-center">
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Total Distance
            </span>
            <span className="font-bold text-emerald-400 text-sm">{routePlan.totalDistanceKm} km</span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-center">
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Est. Duration
            </span>
            <span className="font-bold text-amber-400 text-sm">
              {Math.floor(routePlan.totalDurationMin / 60) > 0
                ? `${Math.floor(routePlan.totalDurationMin / 60)}h ${routePlan.totalDurationMin % 60}m`
                : `${routePlan.totalDurationMin}m`}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition"
            title={isExpanded ? 'Collapse Itinerary' : 'Expand Itinerary'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Savings Notification Callout (Rapido / Logistics style) */}
      {hasSavings && (
        <div className="mt-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Route Distance Minimized:</strong> Saved{' '}
              <span className="font-bold text-emerald-300 underline underline-offset-2">
                {routePlan.distanceSavedKm} km
              </span>{' '}
              (~{routePlan.timeSavedMin} mins faster) compared to unoptimized random stops!
            </span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700 text-emerald-200">
            RAPIDO ALGORITHM
          </span>
        </div>
      )}

      {/* Sequential Turn-by-Turn Leg Timeline */}
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Place A: Origin Godown */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 shadow-md text-xs">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  Place A • Pickup Point
                </span>
                <span className="text-[10px] font-mono bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded">
                  START
                </span>
              </div>
              <p className="text-xs text-white font-medium mt-0.5 truncate">{pickupAddress}</p>
              <p className="text-[11px] text-slate-400">Collect full cargo load & verify vehicle loading</p>
            </div>
          </div>

          {/* Sequential Intermediate Legs & Stops */}
          <div className="relative pl-4 border-l-2 border-slate-700 ml-4 space-y-3">
            {stops.map((stop, idx) => {
              const leg = routePlan.legs[idx];
              const isCurrent = idx === activeStopIndex;
              const isDelivered = stop.status === 'delivered';
              const placeLetter = stop.placeLabel?.replace('Place ', '') || String.fromCharCode(66 + idx);

              return (
                <div
                  key={stop.id}
                  onClick={() => onSelectStop && onSelectStop(idx)}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-950/30 border-amber-500/80 ring-2 ring-amber-500/20'
                      : isDelivered
                      ? 'bg-slate-800/30 border-emerald-800/40 opacity-75'
                      : 'bg-slate-800/50 border-slate-700/70 hover:border-slate-500 hover:bg-slate-800/80'
                  }`}
                >
                  {/* Indicator Dot on the Left Border */}
                  <div
                    className={`absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-sm ${
                      isDelivered
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-amber-400 ring-2 ring-amber-400/40 animate-pulse'
                        : 'bg-blue-500'
                    }`}
                  />

                  {/* Leg Header */}
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded ${
                          isDelivered
                            ? 'bg-emerald-900/60 text-emerald-300'
                            : isCurrent
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-blue-900/60 text-blue-300'
                        }`}
                      >
                        Place {placeLetter} (Stop #{idx + 1})
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        {stop.shopkeeperCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      {leg && (
                        <span className="font-semibold text-slate-300">
                          +{leg.distanceKm} km (~{leg.durationMin}m)
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          stop.status === 'delivered'
                            ? 'bg-emerald-900 text-emerald-300'
                            : stop.status === 'en_route'
                            ? 'bg-blue-900 text-blue-300 animate-pulse'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {stop.status}
                      </span>
                    </div>
                  </div>

                  {/* Shop Details */}
                  <div className="font-semibold text-white text-xs mt-1">{stop.shopName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{stop.address}</div>

                  {/* Cargo / Items to Handover */}
                  <div className="mt-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-start gap-2 text-xs">
                    <PackageCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-slate-400 text-[11px]">Cargo to Deliver: </span>
                      <span className="text-white font-medium">
                        {stop.itemsDescription || `${stop.quantity} ${stop.unitType}`}
                      </span>
                    </div>
                  </div>

                  {/* Driver actions & OTP info */}
                  <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>Contact: {stop.shopkeeperPhone}</span>
                    <div className="flex items-center gap-2">
                      {stop.signedBillPhotoUrl ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 text-[10px]">
                          <FileCheck2 className="w-3 h-3" />
                          <span>Signed Bill Attached</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">
                          Bill sign pending
                        </span>
                      )}
                      <span className="font-mono text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        OTP: {stop.otpGenerated ? stop.deliveryOtp : '••••••'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
