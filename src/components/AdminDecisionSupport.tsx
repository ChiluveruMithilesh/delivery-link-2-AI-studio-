import React, { useState } from 'react';
import {
  STRATEGIC_RECOMMENDATIONS,
  StrategicRecommendation,
} from '../data/adminAnalyticsData';
import {
  Sparkles,
  Zap,
  AlertTriangle,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Navigation,
  Compass,
  ArrowRight,
  ShieldAlert,
  Fuel,
  IndianRupee,
  Clock,
  Layers,
  RefreshCw,
} from 'lucide-react';

interface AdminDecisionSupportProps {
  currentPricing: {
    baseFare: number;
    perKmRate: number;
    perStopFee: number;
  };
  onUpdatePricing: (newPricing: { baseFare: number; perKmRate: number; perStopFee: number }) => void;
  onApplySurge: (amount: number, zone: string) => void;
}

export const AdminDecisionSupport: React.FC<AdminDecisionSupportProps> = ({
  currentPricing,
  onUpdatePricing,
  onApplySurge,
}) => {
  const [recommendations, setRecommendations] = useState<StrategicRecommendation[]>(STRATEGIC_RECOMMENDATIONS);
  const [appliedRecs, setAppliedRecs] = useState<string[]>([]);
  const [activeZone, setActiveZone] = useState<string>('zone4');

  // Interactive Fare Simulator State
  const [simDistanceKm, setSimDistanceKm] = useState<number>(14);
  const [simStopsCount, setSimStopsCount] = useState<number>(4);
  const [simBaseFare, setSimBaseFare] = useState<number>(currentPricing.baseFare);
  const [simPerKm, setSimPerKm] = useState<number>(currentPricing.perKmRate);
  const [simPerStop, setSimPerStop] = useState<number>(currentPricing.perStopFee);
  const [simCommissionRate, setSimCommissionRate] = useState<number>(7.5); // %
  const [simSavedFeedback, setSimSavedFeedback] = useState<boolean>(false);

  // Compute simulated outcomes
  const rawTransportFare = simBaseFare + (simDistanceKm * simPerKm) + (simStopsCount * simPerStop);
  const platformFee = Math.round((rawTransportFare * simCommissionRate) / 100);
  const driverPayout = rawTransportFare - platformFee;
  const estimatedFuelCost = Math.round(simDistanceKm * 3.8); // 3.8 Rs per km auto fuel
  const driverNetIncome = driverPayout - estimatedFuelCost;
  const driverMarginPercent = Math.round((driverNetIncome / driverPayout) * 100);

  const handleApplyRec = (rec: StrategicRecommendation) => {
    if (rec.category === 'supply' && rec.recommendedValue) {
      onApplySurge(rec.recommendedValue, 'Dilsukhnagar & LB Nagar (Zone 4)');
    } else if (rec.category === 'pricing' && rec.recommendedValue) {
      onUpdatePricing({
        ...currentPricing,
        baseFare: rec.recommendedValue,
      });
      setSimBaseFare(rec.recommendedValue);
    }
    setAppliedRecs((prev) => [...prev, rec.id]);
  };

  const handleSaveSimulatedRules = () => {
    onUpdatePricing({
      baseFare: simBaseFare,
      perKmRate: simPerKm,
      perStopFee: simPerStop,
    });
    setSimSavedFeedback(true);
    setTimeout(() => setSimSavedFeedback(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Strategic Advisor Recommendations */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Decision Intelligence & Executive Policy Actions
              </h2>
              <p className="text-xs text-slate-500">
                Data-driven recommendations derived from user growth velocity and 12-month earnings trajectories.
              </p>
            </div>
          </div>
          <span className="text-xs bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-full border border-purple-200">
            {recommendations.length - appliedRecs.length} Actionable Proactive Signals
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {recommendations.map((rec) => {
            const isApplied = appliedRecs.includes(rec.id);
            return (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isApplied
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : rec.severity === 'urgent'
                    ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        rec.severity === 'urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : rec.severity === 'opportunity'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.category.toUpperCase()} • {rec.severity}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{rec.metric}</span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2">{rec.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.impact}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-700 font-medium">
                    <span className="text-slate-400 font-normal">Action: </span>
                    {rec.action}
                  </div>
                  <button
                    onClick={() => handleApplyRec(rec)}
                    disabled={isApplied}
                    className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      isApplied
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Enacted</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Enact Policy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Real-Time Operations Radar & Regional Liquidity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Regional Liquidity Index */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Regional Auto Driver Liquidity Index</h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono">
              Live GPS Cluster
            </span>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Begum Bazar FMCG Wholesale Godowns</span>
                <span className="text-[11px] text-slate-500">Zone 1 • 64 Active Drivers Online</span>
              </div>
              <span className="font-bold text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                Surplus (5.2m pickup)
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Charminar & Old City Kirana Hubs</span>
                <span className="text-[11px] text-slate-500">Zone 2 • 48 Active Drivers Online</span>
              </div>
              <span className="font-bold text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                Balanced (7.8m pickup)
              </span>
            </div>

            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Dilsukhnagar & LB Nagar Corridors</span>
                <span className="text-[11px] text-rose-700">Zone 4 • High Demand / 14 Drivers Online</span>
              </div>
              <span className="font-bold text-xs text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full font-bold">
                Shortage (+18m pickup)
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Secunderabad & General Bazaar</span>
                <span className="text-[11px] text-slate-500">Zone 3 • 36 Active Drivers Online</span>
              </div>
              <span className="font-bold text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                Optimal (6.1m pickup)
              </span>
            </div>
          </div>
        </div>

        {/* Operational SLA Metrics */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Operational SLA & Fulfillment Radar</h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
              SLA Standard 99%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Avg Handover OTP Delay</span>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">1.8 mins</div>
              <span className="text-[10px] text-emerald-600 block mt-0.5">Physical bill signed & verified</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Route Acceptance Rate</span>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-1">94.2%</div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Bids confirmed in &lt; 3 mins</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Multi-Stop Fuel Saved</span>
              <div className="text-xl font-bold font-mono text-amber-600 mt-1">24.6%</div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Via 4-stop routing algorithm</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Exception / Return Rate</span>
              <div className="text-xl font-bold font-mono text-blue-600 mt-1">0.6%</div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Damaged carton disputes</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Pricing & Commission Engine (Simulator & Direct Calibration) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                FMCG Dynamic Pricing & Commission Engine
              </h2>
              <p className="text-xs text-slate-500">
                Calibrate base fares, mileage rates, and platform commission. Simulate driver profitability in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {simSavedFeedback && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Rules Updated!</span>
              </span>
            )}
            <button
              onClick={handleSaveSimulatedRules}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Pricing Rules to Marketplace</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Sliders Form */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Base Fare (₹)
                </label>
                <input
                  type="number"
                  value={simBaseFare}
                  onChange={(e) => setSimBaseFare(Number(e.target.value))}
                  className="w-full text-sm font-mono px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Current: ₹{currentPricing.baseFare}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Per Km Rate (₹/km)
                </label>
                <input
                  type="number"
                  value={simPerKm}
                  onChange={(e) => setSimPerKm(Number(e.target.value))}
                  className="w-full text-sm font-mono px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Current: ₹{currentPricing.perKmRate}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Handling Fee (₹/stop)
                </label>
                <input
                  type="number"
                  value={simPerStop}
                  onChange={(e) => setSimPerStop(Number(e.target.value))}
                  className="w-full text-sm font-mono px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Current: ₹{currentPricing.perStopFee}</span>
              </div>
            </div>

            {/* Platform Commission Rate Slider */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700">Platform Take-Rate Commission</span>
                <span className="font-mono font-bold text-blue-700">{simCommissionRate}%</span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                step="0.5"
                value={simCommissionRate}
                onChange={(e) => setSimCommissionRate(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>4% (Driver subsidy)</span>
                <span>7.5% (Market standard)</span>
                <span>12% (Premium enterprise)</span>
              </div>
            </div>

            {/* Test Trip Scenario Parameters */}
            <div className="p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">Simulation Test Corridor</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Trip Distance ({simDistanceKm} km)</label>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    value={simDistanceKm}
                    onChange={(e) => setSimDistanceKm(Number(e.target.value))}
                    className="w-full accent-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Retail Stops ({simStopsCount} stores)</label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={simStopsCount}
                    onChange={(e) => setSimStopsCount(Number(e.target.value))}
                    className="w-full accent-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Simulator Results Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                  Simulated Route P&L
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  {simDistanceKm} km • {simStopsCount} stops
                </span>
              </div>

              <div className="space-y-2 mt-4 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Gross Wholesaler Bill:</span>
                  <span className="font-mono font-bold text-white text-sm">₹{rawTransportFare}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Platform Commission ({simCommissionRate}%):</span>
                  <span className="font-mono font-bold text-amber-400">₹{platformFee}</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-700">
                  <span>Gross Driver Pay:</span>
                  <span className="font-mono font-bold text-white">₹{driverPayout}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Fuel Consumption (CNG/Diesel):</span>
                  <span className="font-mono text-rose-300">-₹{estimatedFuelCost}</span>
                </div>
                <div className="flex justify-between text-emerald-400 pt-2 border-t border-slate-700 text-sm font-bold">
                  <span>Driver Net Hourly Margin:</span>
                  <span className="font-mono text-base text-emerald-300">₹{driverNetIncome} ({driverMarginPercent}%)</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 space-y-1">
              <span className="text-emerald-400 font-bold block">Feasibility Verdict:</span>
              <p>
                {driverMarginPercent >= 70
                  ? 'High Liquidity: Drivers will accept this route within 2 minutes. Optimal for FMCG morning milk-runs.'
                  : driverMarginPercent >= 55
                  ? 'Balanced: Acceptable driver margin. Meets market median.'
                  : 'Low Margin Risk: Drivers may hesitate to accept 4+ stops. Consider increasing per-stop fee.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
