import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trip, TripStop } from '../types';
import { GoogleMapView } from './GoogleMapView';
import { PersonalizedRouteView } from './PersonalizedRouteView';
import {
  Truck,
  MapPin,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Play,
  KeyRound,
  Navigation,
  Phone,
  Power,
  ShieldCheck,
  History,
  Compass,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Store,
  Info,
  Lock,
  FileCheck2,
  Camera,
} from 'lucide-react';

export const DriverView: React.FC = () => {
  const {
    currentUser,
    trips,
    driverIsOnline,
    toggleDriverOnline,
    acceptTrip,
    placeBid,
    startTrip,
    updateStopStatus,
    updateDriverLocation,
  } = useApp();

  const [counterBidAmount, setCounterBidAmount] = useState<{ [tripId: string]: string }>({});
  const [biddingTripId, setBiddingTripId] = useState<string | null>(null);
  const [otpInputs, setOtpInputs] = useState<{ [stopId: string]: string }>({});
  const [activeSubTab, setActiveSubTab] = useState<'current' | 'nearby' | 'history'>('current');
  const [expandedMapTripId, setExpandedMapTripId] = useState<string | null>(null);

  // Trips assigned to this driver
  const assignedOrActiveTrip = trips.find(
    (t) => (t.driverId === currentUser.id || t.status === 'in_progress') && (t.status === 'assigned' || t.status === 'in_progress')
  ) || trips.find((t) => t.status === 'in_progress');

  // Available open trips published in marketplace
  const nearbyTrips = trips.filter((t) => t.status === 'published');

  // Completed trips by this driver
  const completedTrips = trips.filter(
    (t) => (t.driverId === currentUser.id || t.driverName === currentUser.fullName) && t.status === 'completed'
  );

  const totalEarnings = completedTrips.reduce((acc, t) => acc + t.paymentOffered, 0);
  const totalKm = completedTrips.reduce((acc, t) => acc + t.estimatedDistanceKm, 0);

  const handleOtpSubmit = (tripId: string, stopId: string) => {
    const code = otpInputs[stopId] || '';
    updateStopStatus(tripId, stopId, 'delivered', code);
  };

  return (
    <div className="space-y-6">
      {/* Driver Status Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 text-2xl">
              🛺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">{currentUser.fullName}</h1>
                <span className="font-mono text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                  {currentUser.userCode || 'DRV-7821'}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Driver
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-3">
                <span>Vehicle: <strong className="font-mono text-slate-800">{currentUser.vehicleNumber || 'TS 09 UA 4521'}</strong> (Goods Auto)</span>
                <span>•</span>
                <span>Rating: <strong className="text-amber-600">★ 4.9</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDriverOnline}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                driverIsOnline
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm'
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{driverIsOnline ? 'Status: ONLINE' : 'Status: OFFLINE'}</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <span className="text-xs font-medium text-slate-500">Today's Earnings</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">₹{totalEarnings.toLocaleString()}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <span className="text-xs font-medium text-slate-500">Distance Covered</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalKm.toFixed(1)} km</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <span className="text-xs font-medium text-slate-500">Deliveries Completed</span>
            <div className="text-xl font-bold text-blue-600 mt-1">{completedTrips.length} Trips</div>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('current')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'current'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Active Delivery Trip</span>
          {assignedOrActiveTrip && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('nearby')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'nearby'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Available Nearby Trips</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
            {nearbyTrips.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === 'history'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Earnings & History
        </button>
      </div>

      {/* SUBTAB 1: ACTIVE TRIP EXECUTION CONSOLE */}
      {activeSubTab === 'current' && (
        <div>
          {assignedOrActiveTrip ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Trip Controls & Stops Checklist */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {assignedOrActiveTrip.status === 'assigned' ? 'Ready for Pickup' : 'Trip En Route'}
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">{assignedOrActiveTrip.id}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Distributor: <strong>{assignedOrActiveTrip.distributorName}</strong> ({assignedOrActiveTrip.distributorPhone})
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-600">₹{assignedOrActiveTrip.paymentOffered}</div>
                      <span className="text-xs text-slate-400">Guaranteed Pay</span>
                    </div>
                  </div>

                  {/* Pickup Depot Card (Place A) */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        A
                      </span>
                      <span>Place A • Pickup Warehouse / Godown:</span>
                    </div>
                    <p className="text-xs text-slate-600 pl-7">{assignedOrActiveTrip.pickupAddress}</p>
                    <div className="pl-7 text-xs text-slate-500">
                      Cargo: <strong className="text-slate-700">{assignedOrActiveTrip.goodsDescription}</strong> ({assignedOrActiveTrip.totalQuantity} items)
                    </div>
                  </div>

                  {/* Start Trip Action if Assigned */}
                  {assignedOrActiveTrip.status === 'assigned' && (
                    <button
                      id="start-trip-btn"
                      onClick={() => startTrip(assignedOrActiveTrip.id)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-sm"
                    >
                      <Play className="w-4 h-4" />
                      <span>Confirm Goods Loaded & Start Route</span>
                    </button>
                  )}

                  {/* Stops Execution Flow */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                      <span>Delivery Stops Checklist (Personalized Sequence)</span>
                      <span className="text-xs font-normal text-slate-500">
                        {assignedOrActiveTrip.stops.filter((s) => s.status === 'delivered').length} of {assignedOrActiveTrip.totalStops} done
                      </span>
                    </h3>

                    <div className="space-y-3">
                      {assignedOrActiveTrip.stops.map((stop, idx) => {
                        const isDelivered = stop.status === 'delivered';
                        const isArrived = stop.status === 'arrived';
                        const isEnRoute = stop.status === 'en_route';
                        const placeLetter = stop.placeLabel?.replace('Place ', '') || String.fromCharCode(66 + idx);

                        return (
                          <div
                            key={stop.id}
                            className={`p-4 rounded-xl border transition-all ${
                              isDelivered
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : isArrived || isEnRoute
                                ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20'
                                : 'bg-slate-50/40 border-slate-200 opacity-80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <span
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                    isDelivered
                                      ? 'bg-emerald-600 text-white'
                                      : isArrived || isEnRoute
                                      ? 'bg-amber-500 text-slate-950 font-bold'
                                      : 'bg-slate-300 text-slate-700'
                                  }`}
                                >
                                  {placeLetter}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900">{stop.shopName}</span>
                                    {stop.shopkeeperCode && (
                                      <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                                        {stop.shopkeeperCode}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">{stop.address}</div>
                                  <div className="text-xs text-slate-700 font-semibold mt-1 flex flex-wrap items-center gap-1.5">
                                    <span>Deliver:</span>
                                    {stop.cargoPackages && stop.cargoPackages.length > 0 ? (
                                      stop.cargoPackages.map((p, pIdx) => (
                                        <span
                                          key={p.id || pIdx}
                                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
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
                                      <span>{stop.itemsDescription || `${stop.quantity} ${stop.unitType}`}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                {isDelivered ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Delivered
                                  </span>
                                ) : (
                                  <a
                                    href={`tel:${stop.shopkeeperPhone}`}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-2 py-1 rounded-lg"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>Call</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Actions for current active stop */}
                            {(isEnRoute || isArrived) && assignedOrActiveTrip.status === 'in_progress' && (
                              <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-3">
                                {isEnRoute && (
                                  <button
                                    onClick={() => updateStopStatus(assignedOrActiveTrip.id, stop.id, 'arrived')}
                                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-2 rounded-lg transition-colors shadow-xs"
                                  >
                                    <Navigation className="w-3.5 h-3.5" />
                                    <span>Mark "Arrived at Shop"</span>
                                  </button>
                                )}

                                {isArrived && (
                                  <div className="bg-white p-3.5 rounded-xl border border-amber-300 space-y-3">
                                    {/* Workflow Guidance based on whether bill photo was uploaded */}
                                    {!stop.signedBillPhotoUrl && !stop.otpGenerated ? (
                                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs space-y-1.5">
                                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                          <FileCheck2 className="w-4 h-4 text-amber-700 shrink-0" />
                                          <span>Awaiting Shopkeeper Bill Signing & Photo Upload</span>
                                        </div>
                                        <p className="text-[11px] text-amber-800 leading-relaxed">
                                          1. Hand physical delivery challan/bill to {stop.shopName}.
                                          <br />
                                          2. Shopkeeper verifies items, signs bill, and uploads a photograph in their portal.
                                          <br />
                                          3. Their 6-digit OTP will unlock as soon as they upload the photo.
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-medium pt-0.5">
                                          <Lock className="w-3 h-3" />
                                          <span>OTP locked on shopkeeper's screen until bill is uploaded</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs flex items-center gap-2 text-emerald-800 font-semibold">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Shopkeeper signed bill & uploaded photo! Ask for their 6-digit OTP below.</span>
                                      </div>
                                    )}

                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                          <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                                          <span>Enter Shopkeeper's 6-Digit Handover OTP</span>
                                        </div>
                                        {stop.otpGenerated && (
                                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                            OTP ACTIVE
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          maxLength={6}
                                          placeholder="6-digit code"
                                          value={otpInputs[stop.id] || ''}
                                          onChange={(e) =>
                                            setOtpInputs({ ...otpInputs, [stop.id]: e.target.value })
                                          }
                                          className="w-32 font-mono text-center tracking-widest text-sm px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                          onClick={() => handleOtpSubmit(assignedOrActiveTrip.id, stop.id)}
                                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors shadow-xs"
                                        >
                                          Verify & Complete Handover
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Map & Personalized Route Column */}
              <div className="lg:col-span-6 space-y-5">
                {/* Live Google Maps with GPS & Simulation */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-amber-500" />
                      Google Maps Live Auto GPS & Minimum Route
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      {assignedOrActiveTrip.estimatedDistanceKm} km • {assignedOrActiveTrip.totalStops} Shops
                    </span>
                  </div>

                  <GoogleMapView
                    pickup={{
                      lat: assignedOrActiveTrip.pickupLat,
                      lng: assignedOrActiveTrip.pickupLng,
                      address: assignedOrActiveTrip.pickupAddress,
                      label: 'Place A',
                    }}
                    stops={assignedOrActiveTrip.stops}
                    routePlan={assignedOrActiveTrip.routePlan}
                    currentDriverLat={assignedOrActiveTrip.currentDriverLat}
                    currentDriverLng={assignedOrActiveTrip.currentDriverLng}
                    onDriverLocationUpdate={(lat, lng, speed) => {
                      updateDriverLocation(assignedOrActiveTrip.id, lat, lng, speed);
                    }}
                    heightClass="h-96"
                  />
                </div>

                {/* Rapido-Style Personalized Route Plan */}
                <PersonalizedRouteView
                  routePlan={assignedOrActiveTrip.routePlan}
                  stops={assignedOrActiveTrip.stops}
                  pickupAddress={assignedOrActiveTrip.pickupAddress}
                  title="Your Personalized Minimum-Distance Route (Rapido Algorithm)"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">No Active Trip Assigned</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                You are currently free. Check the "Available Nearby Trips" tab to accept FMCG wholesale orders in your locality.
              </p>
              <button
                onClick={() => setActiveSubTab('nearby')}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm"
              >
                <span>Browse Nearby Trips ({nearbyTrips.length})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: AVAILABLE NEARBY TRIPS WITH PERSONALIZED ROUTE PREVIEW */}
      {activeSubTab === 'nearby' && (
        <div className="space-y-4">
          {!driverIsOnline && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>You are currently OFFLINE. Toggle online above to accept deliveries.</span>
              </div>
              <button
                onClick={toggleDriverOnline}
                className="bg-amber-600 text-white px-3 py-1 rounded-lg font-semibold"
              >
                Go Online
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyTrips.map((trip) => {
              const isBidding = biddingTripId === trip.id;
              const isMapExpanded = expandedMapTripId === trip.id;

              return (
                <div key={trip.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900">{trip.id}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                          Open Trip
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Distributor: {trip.distributorName}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">₹{trip.paymentOffered}</div>
                      <span className="text-[11px] text-slate-400">Guaranteed Pay</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 font-medium text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span className="truncate">From (Place A): {trip.pickupAddress}</span>
                    </div>
                    <div className="pl-5 text-slate-500">
                      Cargo: {trip.goodsDescription} ({trip.totalQuantity} items)
                    </div>
                  </div>

                  {/* Route Plan Highlight Pill (Rapido Minimum Distance) */}
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-emerald-900">Personalized Route (Rapido Min Distance)</span>
                        <span className="block text-[11px] text-emerald-700">
                          {trip.routePlan?.distanceSavedKm ? `Saves ${trip.routePlan.distanceSavedKm} km (${trip.routePlan.timeSavedMin} mins)` : 'Optimized 2-opt sequence'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedMapTripId(isMapExpanded ? null : trip.id)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-emerald-200"
                    >
                      <span>{isMapExpanded ? 'Hide Map' : 'View Route'}</span>
                      {isMapExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Expandable Google Map & Route Details */}
                  {isMapExpanded && (
                    <div className="space-y-3 pt-2">
                      <GoogleMapView
                        pickup={{
                          lat: trip.pickupLat,
                          lng: trip.pickupLng,
                          address: trip.pickupAddress,
                          label: 'Place A',
                        }}
                        stops={trip.stops}
                        routePlan={trip.routePlan}
                        heightClass="h-64"
                      />
                      <PersonalizedRouteView
                        routePlan={trip.routePlan}
                        stops={trip.stops}
                        pickupAddress={trip.pickupAddress}
                        title={`Route Plan: ${trip.id}`}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600 border-y border-slate-100 py-2.5">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Distance</span>
                      <strong className="text-slate-800">{trip.estimatedDistanceKm} km</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Stops</span>
                      <strong className="text-slate-800">{trip.totalStops} Shops</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Est. Time</span>
                      <strong className="text-slate-800">~{trip.estimatedDurationMin} min</strong>
                    </div>
                  </div>

                  {/* Actions: Accept or Bid */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => acceptTrip(trip.id)}
                        disabled={!driverIsOnline}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-xs"
                      >
                        Accept Trip at ₹{trip.paymentOffered}
                      </button>
                      <button
                        onClick={() => setBiddingTripId(isBidding ? null : trip.id)}
                        className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Counter Bid
                      </button>
                    </div>

                    {isBidding && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">₹</span>
                        <input
                          type="number"
                          placeholder="Your fare offer"
                          value={counterBidAmount[trip.id] || ''}
                          onChange={(e) =>
                            setCounterBidAmount({ ...counterBidAmount, [trip.id]: e.target.value })
                          }
                          className="w-28 text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                        <button
                          onClick={() => {
                            const val = Number(counterBidAmount[trip.id]);
                            if (val > 0) {
                              placeBid(trip.id, val);
                              setBiddingTripId(null);
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                        >
                          Submit Bid
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: HISTORY & EARNINGS */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Delivery History & Payouts</h2>
              <p className="text-xs text-slate-500">Record of all completed multi-stop delivery journeys</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Disbursed</span>
              <span className="text-base font-bold text-emerald-600">₹{totalEarnings.toLocaleString()}</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {completedTrips.map((trip) => (
              <div key={trip.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{trip.id}</span>
                    <span className="text-xs text-slate-500">• {trip.totalStops} Shops</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                      COMPLETED
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {trip.pickupAddress} ➔ {trip.stops.map((s) => s.shopName).join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600">+₹{trip.paymentOffered}</div>
                  <span className="text-[11px] text-slate-400">{trip.estimatedDistanceKm} km</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
