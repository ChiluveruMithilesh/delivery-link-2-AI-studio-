import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminAnalyticsCharts } from './AdminAnalyticsCharts';
import { AdminDecisionSupport } from './AdminDecisionSupport';
import { downloadAdminReport } from '../utils/adminReports';
import { RECENT_AUDIT_LOGS, USER_DEMOGRAPHICS } from '../data/adminAnalyticsData';
import {
  Shield,
  Check,
  X,
  Users,
  Truck,
  Building2,
  Store,
  FileText,
  IndianRupee,
  Settings,
  TrendingUp,
  BarChart3,
  Sliders,
  History,
  Download,
  Search,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Clock,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { pendingDrivers, verifyDriver, users, trips, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'analytics' | 'decisions' | 'verification' | 'users' | 'pricing' | 'audit'>('analytics');

  // Dynamic Pricing rules
  const [pricingRules, setPricingRules] = useState({
    baseFare: 250,
    perKmRate: 25,
    perStopFee: 40,
  });

  // User filter state
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'shopkeeper' | 'driver' | 'distributor' | 'admin'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Driver KYC filter state
  const [driverFilter, setDriverFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Pricing rules updated notification
  const [pricingNotice, setPricingNotice] = useState<string | null>(null);

  // High-level operational metrics
  const totalGMV = trips.reduce((acc, t) => acc + t.goodsValue, 0);
  const totalDeliveries = trips.filter((t) => t.status === 'completed').length;
  const activeTripsCount = trips.filter((t) => t.status === 'in_progress').length;
  const pendingKycCount = pendingDrivers.filter((d) => d.verificationStatus === 'pending').length;

  const handleUpdatePricing = (newRules: { baseFare: number; perKmRate: number; perStopFee: number }) => {
    setPricingRules(newRules);
    setPricingNotice(`Pricing updated: Base ₹${newRules.baseFare}, ₹${newRules.perKmRate}/km, ₹${newRules.perStopFee}/stop`);
    showToast?.('Pricing rules updated across FMCG network');
    setTimeout(() => setPricingNotice(null), 4000);
  };

  const handleApplySurge = (amount: number, zone: string) => {
    showToast?.(`Surge incentive of +₹${amount} deployed in ${zone}`);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.userCode.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.phone.includes(userSearchQuery) ||
      (u.businessName && u.businessName.toLowerCase().includes(userSearchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  // Filtered drivers
  const filteredDrivers = pendingDrivers.filter((d) => {
    if (driverFilter === 'all') return true;
    return d.verificationStatus === driverFilter;
  });

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. OPERATIONS ADMIN BANNER & EXECUTIVE KPIs */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Operations & Executive Intelligence Console</h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Grid Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Oversee FMCG milk-run dispatches, driver KYC accreditation, regional supply liquidity, and data-driven profitability models.
              </p>
            </div>
          </div>

          {/* Quick Action Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadAdminReport('full_executive_summary')}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Executive BI Report (CSV)</span>
            </button>
          </div>
        </div>

        {/* High-Impact Executive Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Platform GMV (Run-rate)</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                +41.2% YoY
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">₹1.66 Cr</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">₹15.36L processed this week</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Dispatches</span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                Live Radar
              </span>
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{activeTripsCount} Trips</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">99.4% on-time SLA rate</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Registered Users</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                +18.2% (30d)
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">1,472</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">984 Retailers • 342 Drivers</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pending Driver KYC</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                pendingKycCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {pendingKycCount > 0 ? 'Action Needed' : 'Cleared'}
              </span>
            </div>
            <div className={`text-2xl font-black mt-1 font-mono ${
              pendingKycCount > 0 ? 'text-rose-600' : 'text-slate-800'
            }`}>
              {pendingKycCount}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Aadhaar & DL Verification</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ADMIN NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'analytics'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Executive BI & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'decisions'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Strategic Decision Advisor & Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'verification'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Driver KYC Verification</span>
          {pendingKycCount > 0 && (
            <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {pendingKycCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'users'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Registry ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'pricing'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Pricing & Fare Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'audit'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trail</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE BI & DATA VISUALIZATION (REQUESTED GRAPHS) */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && <AdminAnalyticsCharts />}

      {/* ========================================================================= */}
      {/* TAB 2: STRATEGIC DECISION ADVISOR & REGIONAL RADAR */}
      {/* ========================================================================= */}
      {activeTab === 'decisions' && (
        <AdminDecisionSupport
          currentPricing={pricingRules}
          onUpdatePricing={handleUpdatePricing}
          onApplySurge={handleApplySurge}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DRIVER KYC & DOCUMENT VERIFICATION */}
      {/* ========================================================================= */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Driver Accreditation & Document Desk</h2>
              <p className="text-xs text-slate-500">
                Inspect Commercial Driving License (DL), Vehicle Registration (RC), and payload capacity specifications.
              </p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setDriverFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  driverFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({pendingDrivers.length})
              </button>
              <button
                onClick={() => setDriverFilter('pending')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  driverFilter === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingDrivers.filter((d) => d.verificationStatus === 'pending').length})
              </button>
              <button
                onClick={() => setDriverFilter('approved')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  driverFilter === 'approved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setDriverFilter('rejected')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  driverFilter === 'rejected' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredDrivers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No driver applications match this filter</p>
                <p className="text-xs text-slate-400 mt-0.5">All applications have been processed or none exist.</p>
              </div>
            ) : (
              filteredDrivers.map((driver) => {
                const isPending = driver.verificationStatus === 'pending';

                return (
                  <div
                    key={driver.id}
                    className="p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{driver.fullName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            driver.verificationStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : driver.verificationStatus === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {driver.verificationStatus}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">Applied: {driver.appliedDate}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 mt-2.5">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Contact</span>
                          <strong className="text-slate-800 font-mono">{driver.phone}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Commercial DL</span>
                          <strong className="font-mono text-slate-800">{driver.drivingLicenceNumber}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Vehicle RC No.</span>
                          <strong className="font-mono text-slate-800">{driver.vehicleNumber}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Vehicle / Payload</span>
                          <strong className="text-slate-800 font-medium">
                            {driver.vehicleCapacityKg} kg ({driver.vehicleType})
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => {
                              verifyDriver(driver.id, 'approved');
                              showToast?.(`Approved driver: ${driver.fullName}`);
                            }}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Captain</span>
                          </button>
                          <button
                            onClick={() => {
                              verifyDriver(driver.id, 'rejected');
                              showToast?.(`Rejected application for: ${driver.fullName}`);
                            }}
                            className="inline-flex items-center gap-1.5 bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 text-xs font-bold py-2 px-3 rounded-xl transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
                          Status: {driver.verificationStatus}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: USER DIRECTORY & RBAC CONTROLS */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Platform Stakeholder Directory</h2>
              <p className="text-xs text-slate-500">
                Search and manage accounts across Retailers, Auto Drivers, and FMCG Wholesalers.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user, phone, code..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setUserRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                userRoleFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              All Roles ({users.length})
            </button>
            <button
              onClick={() => setUserRoleFilter('shopkeeper')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                userRoleFilter === 'shopkeeper'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Retail Kiranas ({users.filter((u) => u.role === 'shopkeeper').length})
            </button>
            <button
              onClick={() => setUserRoleFilter('driver')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                userRoleFilter === 'driver'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Auto Captains ({users.filter((u) => u.role === 'driver').length})
            </button>
            <button
              onClick={() => setUserRoleFilter('distributor')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                userRoleFilter === 'distributor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Wholesalers ({users.filter((u) => u.role === 'distributor').length})
            </button>
            <button
              onClick={() => setUserRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                userRoleFilter === 'admin'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Ops Admins ({users.filter((u) => u.role === 'admin').length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition flex items-center gap-3.5"
              >
                <div
                  className={`w-11 h-11 rounded-xl text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                    u.role === 'shopkeeper'
                      ? 'bg-emerald-600'
                      : u.role === 'driver'
                      ? 'bg-amber-600'
                      : u.role === 'distributor'
                      ? 'bg-blue-600'
                      : 'bg-rose-600'
                  }`}
                >
                  {u.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">{u.fullName}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                        u.role === 'shopkeeper'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.role === 'driver'
                          ? 'bg-amber-100 text-amber-800'
                          : u.role === 'distributor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {u.userCode} • {u.phone}
                  </p>
                  {u.businessName && (
                    <p className="text-xs text-slate-800 font-semibold truncate mt-1">{u.businessName}</p>
                  )}
                  {u.vehicleNumber && (
                    <p className="text-xs text-slate-600 font-mono mt-0.5">
                      Vehicle: {u.vehicleNumber} ({u.vehicleType})
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PRICING & FARE RULES CALIBRATION */}
      {/* ========================================================================= */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">Marketplace Fare Pricing Calibration</h2>
            <p className="text-xs text-slate-500">
              Configure baseline algorithm for multi-stop FMCG milk-run trip pricing.
            </p>
          </div>

          {pricingNotice && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{pricingNotice}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Dispatch Fare (₹)</label>
              <input
                type="number"
                value={pricingRules.baseFare}
                onChange={(e) => setPricingRules({ ...pricingRules, baseFare: Number(e.target.value) })}
                className="w-full text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-200"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard flag-drop fee covering driver godown arrival and vehicle preparation.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Per Kilometer Transit Rate (₹/km)</label>
              <input
                type="number"
                value={pricingRules.perKmRate}
                onChange={(e) => setPricingRules({ ...pricingRules, perKmRate: Number(e.target.value) })}
                className="w-full text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-200"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Calculated over the optimized multi-stop path connecting all designated retail shops.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Retail Stop Handling Fee (₹/stop)</label>
              <input
                type="number"
                value={pricingRules.perStopFee}
                onChange={(e) => setPricingRules({ ...pricingRules, perStopFee: Number(e.target.value) })}
                className="w-full text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-200"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Driver compensation for parking, carton unloading, item verification, and OTP handover.
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleUpdatePricing(pricingRules)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Save & Apply Pricing Rules</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: AUDIT TRAIL & SYSTEM LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Administrative Audit & Compliance Trail</h2>
              <p className="text-xs text-slate-500">
                Immutable security logs of driver accreditation, fare calibration, and e-PoD verification events.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Live Sync</span>
          </div>

          <div className="divide-y divide-slate-100">
            {RECENT_AUDIT_LOGS.map((log) => (
              <div key={log.id} className="py-3.5 flex items-start justify-between gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs mt-0.5 shrink-0">
                    <Activity className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.event}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {log.type}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{log.details}</p>
                    <span className="text-[11px] text-slate-400 mt-1 block">Actor: {log.actor}</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
