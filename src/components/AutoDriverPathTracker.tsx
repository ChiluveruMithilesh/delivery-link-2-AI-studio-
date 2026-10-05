import React from 'react';
import { Trip, TripStop } from '../types';
import { CheckCircle2, Navigation, Clock, Store, MapPin, Phone, ShieldCheck, Eye, Download } from 'lucide-react';

interface AutoDriverPathTrackerProps {
  trip: Trip;
  onViewProof?: (stop: TripStop) => void;
}

export const AutoDriverPathTracker: React.FC<AutoDriverPathTrackerProps> = ({ trip, onViewProof }) => {
  // Build the complete path nodes list:
  // Node 0 is Godown (Place A)
  // Nodes 1..N are the stops (Place B, C, D, E...) or labeled A, B, C, D, E
  const stops = trip.stops || [];

  // Determine which stop is currently active/target
  // Any stop with status 'delivered' is covered
  // The first stop with 'en_route', 'arrived', or 'pending' is the active target
  const deliveredCount = stops.filter((s) => s.status === 'delivered').length;
  const isTripCompleted = trip.status === 'completed' || (stops.length > 0 && deliveredCount === stops.length);

  // Active target stop index among the stops (0-based)
  let activeTargetIndex = stops.findIndex((s) => s.status === 'en_route' || s.status === 'arrived');
  if (activeTargetIndex === -1) {
    activeTargetIndex = stops.findIndex((s) => s.status === 'pending');
  }
  if (activeTargetIndex === -1 && stops.length > 0) {
    activeTargetIndex = stops.length - 1;
  }

  // Construct points array:
  // Origin is Godown (Depot)
  // Delivery Shops are A, B, C, D, E...
  const allNodes = [
    {
      id: 'node-godown-pickup',
      letter: '📦',
      labelName: 'Godown',
      title: 'Central Godown',
      subtitle: trip.pickupAddress.split(',')[0],
      isGodown: true,
      isCovered: true, // Godown pickup is covered once trip is dispatched
      isTarget: false,
      stopData: null as TripStop | null,
    },
    ...stops.map((stop, idx) => {
      // Direct A, B, C, D, E labeling for shops 1 to N
      const letter = String.fromCharCode(65 + idx); // A, B, C, D, E...
      const isCovered = stop.status === 'delivered';
      const isTarget = !isCovered && idx === activeTargetIndex && trip.status === 'in_progress';
      return {
        id: stop.id,
        letter,
        labelName: `Shop ${letter}`,
        title: stop.shopName,
        subtitle: stop.locality || stop.address.split(',')[0],
        isGodown: false,
        isCovered,
        isTarget,
        stopData: stop,
      };
    }),
  ];

  // Which node is the auto currently traveling to?
  const targetNode = allNodes.find((n) => n.isTarget) || (isTripCompleted ? null : allNodes[activeTargetIndex + 1]);
  // Last covered node before target
  const lastCoveredIndex = isTripCompleted
    ? allNodes.length - 1
    : Math.max(0, allNodes.findIndex((n) => n.id === targetNode?.id) - 1);
  const lastCoveredNode = allNodes[lastCoveredIndex];

  // Covered shops count
  const coveredShops = stops.filter((s) => s.status === 'delivered');

  return (
    <div className="space-y-4">
      {/* Path Tracker Header & Live Position Status */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base border border-amber-500/30">
              🛺
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                Auto Driver Live Path Indicator
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {trip.driverName ? `Captain ${trip.driverName}` : 'Delivery Path Monitor'} ({trip.id})
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                isTripCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : trip.status === 'in_progress'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {isTripCompleted
                ? 'All Stops Delivered'
                : trip.status === 'in_progress'
                ? `Auto traveling to ${targetNode ? targetNode.letter : 'Next Stop'}`
                : trip.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Live Traveling Highlight Banner */}
        <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xl shrink-0 shadow-sm animate-bounce">
              🛺
            </div>
            <div className="min-w-0">
              {isTripCompleted ? (
                <div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Trip Completed Successfully!</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    All shops have received deliveries.
                  </div>
                </div>
              ) : targetNode ? (
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 truncate">
                    <span>Auto is currently traveling to</span>
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs font-black inline-flex items-center justify-center">
                      {targetNode.letter}
                    </span>
                    <span className="truncate">({targetNode.title})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {lastCoveredNode ? `Departed from ${lastCoveredNode.labelName} (${lastCoveredNode.title})` : 'En route from Godown'}
                    {' ➔ '}
                    Heading to {targetNode.labelName}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Auto Driver Ready at Place A (Godown)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Waiting to begin delivery sequence to shops.
                  </div>
                </div>
              )}
            </div>
          </div>

          {targetNode && targetNode.stopData && targetNode.stopData.shopkeeperPhone && (
            <a
              href={`tel:${targetNode.stopData.shopkeeperPhone}`}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1 shadow-sm"
            >
              <Phone className="w-3 h-3" />
              <span className="hidden sm:inline">Call Shop {targetNode.letter}</span>
              <span className="sm:hidden">Call</span>
            </a>
          )}
        </div>

        {/* Visual Delivery Path Pipeline (A, B, C, D, E) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold flex items-center gap-1.5">
              <span>Delivery Path:</span>
              <span className="text-slate-300">
                {allNodes.map((n) => n.letter).join(' ➔ ')}
              </span>
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              ● Green = Covered • 🛺 = Auto Traveling
            </span>
          </div>

          {/* Connected Path Nodes Ribbon */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/90 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-between min-w-[500px] py-4 relative">
              {allNodes.map((node, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === allNodes.length - 1;
                const isTravelingBetweenThisAndNext =
                  node.isCovered &&
                  !isTripCompleted &&
                  allNodes[idx + 1] &&
                  allNodes[idx + 1].id === targetNode?.id;

                return (
                  <React.Fragment key={node.id}>
                    {/* Node Circle & Details */}
                    <div className="flex flex-col items-center text-center relative z-10 w-24 shrink-0">
                      {/* Node Circle */}
                      <div
                        className={`w-12 h-12 rounded-full flex flex-col items-center justify-center font-black text-sm transition-all duration-300 shadow-md ${
                          node.isCovered
                            ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 shadow-emerald-500/30'
                            : node.isTarget
                            ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 shadow-amber-400/40 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border-2 border-slate-700'
                        }`}
                      >
                        <span className="text-base leading-none">{node.letter}</span>
                        {node.isCovered && (
                          <span className="text-[9px] font-bold text-emerald-100 leading-none mt-0.5">
                            ✓
                          </span>
                        )}
                        {node.isTarget && (
                          <span className="text-[8px] font-bold uppercase tracking-tight leading-none mt-0.5">
                            Target
                          </span>
                        )}
                      </div>

                      {/* Node Label & Name */}
                      <div className="mt-2 space-y-0.5 max-w-[96px]">
                        <span
                          className={`text-xs font-bold block truncate ${
                            node.isCovered
                              ? 'text-emerald-400'
                              : node.isTarget
                              ? 'text-amber-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {node.labelName}
                        </span>
                        <span className="text-[10px] text-slate-300 block truncate font-medium">
                          {node.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                            node.isCovered
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : node.isTarget
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {node.isCovered ? 'Covered' : node.isTarget ? 'En Route' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Connecting Segment between Nodes */}
                    {!isLast && (
                      <div className="flex-1 relative flex items-center justify-center px-1 -mt-8">
                        {/* Background track line */}
                        <div
                          className={`h-1.5 w-full rounded-full transition-all ${
                            allNodes[idx + 1].isCovered
                              ? 'bg-emerald-500'
                              : isTravelingBetweenThisAndNext
                              ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500'
                              : 'bg-slate-800'
                          }`}
                        ></div>

                        {/* Traveling Auto Graphic if auto is moving on this segment */}
                        {isTravelingBetweenThisAndNext && (
                          <div className="absolute -top-5 flex flex-col items-center animate-pulse">
                            <span className="text-xl filter drop-shadow-md">🛺</span>
                            <span className="text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md font-mono whitespace-nowrap shadow-xs mt-0.5">
                              Traveling ➔ {allNodes[idx + 1].letter}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown List of Stops (Place A, Place B, Place C, Place D, Place E...) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-blue-600" />
            <span>Path Stations & Delivery Status</span>
          </h4>
          <span className="text-xs text-slate-500">
            {deliveredCount} of {stops.length} Shops Completed
          </span>
        </div>

        <div className="space-y-2.5">
          {allNodes.map((node) => {
            const stop = node.stopData;
            const hasSignedBill = Boolean(stop?.signedBillPhotoUrl);

            return (
              <div
                key={node.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  node.isCovered
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : node.isTarget
                    ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Big Node Letter Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                      node.isCovered
                        ? 'bg-emerald-600 text-white'
                        : node.isTarget
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {node.isCovered ? `${node.letter} ✓` : node.letter}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {node.labelName}: {node.title}
                      </span>
                      {stop && (
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 shrink-0">
                          {stop.shopkeeperCode}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          node.isCovered
                            ? 'bg-emerald-100 text-emerald-800'
                            : node.isTarget
                            ? 'bg-amber-100 text-amber-900 font-black animate-pulse'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {node.isCovered
                          ? '✓ Covered'
                          : node.isTarget
                          ? '🛺 Auto Traveling Here'
                          : 'Pending'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {node.isGodown ? trip.pickupAddress : stop?.address}
                    </p>

                    {/* Cargo to deliver for shop */}
                    {stop && (
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="text-[10px] text-slate-400 font-semibold mr-1">Cargo:</span>
                        {stop.cargoPackages && stop.cargoPackages.length > 0 ? (
                          stop.cargoPackages.map((p, pIdx) => (
                            <span
                              key={p.id || pIdx}
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                p.unitType === 'cartons'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : p.unitType === 'bags'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-900 border-amber-300'
                              }`}
                            >
                              {p.quantity} {p.unitType}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-700 font-semibold">
                            {stop.itemsDescription || `${stop.quantity} ${stop.unitType}`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {stop && stop.shopkeeperPhone && (
                    <a
                      href={`tel:${stop.shopkeeperPhone}`}
                      className="px-2.5 py-1 text-slate-700 hover:text-blue-700 bg-white border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Call</span>
                    </a>
                  )}

                  {hasSignedBill && onViewProof && stop && (
                    <button
                      type="button"
                      onClick={() => onViewProof(stop)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>View Signed Bill</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
