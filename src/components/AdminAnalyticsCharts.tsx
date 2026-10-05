import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  USERS_LAST_30_DAYS,
  EARNINGS_LAST_WEEK,
  EARNINGS_LAST_3_MONTHS,
  EARNINGS_LAST_YEAR,
  USER_DEMOGRAPHICS,
} from '../data/adminAnalyticsData';
import { downloadAdminReport } from '../utils/adminReports';
import {
  Users,
  TrendingUp,
  Calendar,
  IndianRupee,
  Download,
  Filter,
  Layers,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

type AnalyticsScope = 'all' | 'users_30d' | 'earnings_week' | 'earnings_3m' | 'earnings_year';

export const AdminAnalyticsCharts: React.FC = () => {
  const [selectedScope, setSelectedScope] = useState<AnalyticsScope>('all');
  const [currencyUnit, setCurrencyUnit] = useState<'k' | 'lakhs'>('lakhs');

  // Currency Formatter Helper
  const formatCurrency = (val: number) => {
    if (currencyUnit === 'lakhs') {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
      return `₹${val.toLocaleString('en-IN')}`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1 z-50">
          <p className="font-bold text-slate-200 border-b border-slate-700/80 pb-1 mb-1.5">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-slate-300">{p.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {typeof p.value === 'number' && p.dataKey?.toString().toLowerCase().includes('rate')
                  ? `${p.value}%`
                  : typeof p.value === 'number' &&
                    (p.dataKey?.toString().toLowerCase().includes('gmv') ||
                     p.dataKey?.toString().toLowerCase().includes('revenue') ||
                     p.dataKey?.toString().toLowerCase().includes('payout'))
                  ? `₹${p.value.toLocaleString('en-IN')}`
                  : p.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Sub-Header & Scope Selector */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Operations BI Reports & Visualizations
            </h2>
            <p className="text-xs text-slate-500">
              Visual analytics to evaluate network liquidity, regional driver supply, and GMV trajectories.
            </p>
          </div>
        </div>

        {/* View Mode Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setSelectedScope('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedScope === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All 4 Reports
            </button>
            <button
              onClick={() => setSelectedScope('users_30d')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedScope === 'users_30d'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Users (30 Days)
            </button>
            <button
              onClick={() => setSelectedScope('earnings_week')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedScope === 'earnings_week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Earnings (Week)
            </button>
            <button
              onClick={() => setSelectedScope('earnings_3m')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedScope === 'earnings_3m'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Earnings (3 Months)
            </button>
            <button
              onClick={() => setSelectedScope('earnings_year')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedScope === 'earnings_year'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Earnings (1 Year)
            </button>
          </div>

          {/* Export Action */}
          <button
            onClick={() => downloadAdminReport(selectedScope === 'all' ? 'full_executive_summary' : selectedScope)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shadow-xs"
            title="Download CSV report data"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. USERS LAST 30 DAYS GRAPH */}
      {/* ========================================================================= */}
      {(selectedScope === 'all' || selectedScope === 'users_30d') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Users Last 30 Days (Growth & Acquisition Velocity)
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +18.2% Growth
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Daily cumulative registered users, daily onboarding breakdown by role (Retailers, Drivers, Wholesalers), and active sessions.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-medium">30-Day Net Additions</span>
                <div className="font-bold font-mono text-emerald-600 text-sm">+332 Users</div>
              </div>
              <div className="text-right border-l border-slate-200 pl-4">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Daily Acquisition Avg</span>
                <div className="font-bold font-mono text-slate-800 text-sm">11.1 users/day</div>
              </div>
              <button
                onClick={() => downloadAdminReport('users_30d')}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Download 30-day user raw dataset"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User Chart Section: 2 Columns (Main Area Chart + Demographic Donut Breakdown) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Main Area Chart */}
            <div className="lg:col-span-8">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={USERS_LAST_30_DAYS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="newUsersGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      interval={3}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', color: '#475569' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalUsers"
                      name="Total Registered Users (Cumulative)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#userGrowthGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="activeSessions"
                      name="Daily Active App Sessions"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#newUsersGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Sub-breakdown: Stacked daily acquisition */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-slate-700">30-Day Daily Mix:</span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Retailers (+221)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Drivers (+82)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>Distributors (+29)</span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Peak: +17 users on Sep 12
                </span>
              </div>
            </div>

            {/* Side Column: Role Composition Donut & Decision Takeaway */}
            <div className="lg:col-span-4 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Platform User Role Ratio
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  1,472 Total Active Stakeholders across Greater Hyderabad
                </p>

                <div className="h-40 w-full relative mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={USER_DEMOGRAPHICS}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={62}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="role"
                      >
                        {USER_DEMOGRAPHICS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-base font-extrabold text-slate-900">1,472</span>
                    <span className="text-[10px] text-slate-500">Total Users</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs pt-1">
                  {USER_DEMOGRAPHICS.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                        <span className="text-slate-700 text-[11px]">{d.role}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {d.count} <span className="text-slate-400 font-normal">({d.percentage}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Decision Badge */}
              <div className="p-2.5 rounded-lg bg-emerald-100/60 border border-emerald-300 text-xs text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Managerial Decision Takeaway</span>
                </div>
                <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                  Retailer onboarding is accelerating at <strong>2.8x</strong> driver growth. Admin should approve pending driver applications to preserve a healthy <strong>1 driver per 4 active stores</strong> ratio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EARNINGS LAST WEEK GRAPH */}
      {/* ========================================================================= */}
      {(selectedScope === 'all' || selectedScope === 'earnings_week') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Earnings Last Week (Daily Run-Rate: 09 Sep - 15 Sep)
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  ₹15.36 Lakhs GMV
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Day-by-day comparison of Gross Merchandise Value (GMV), auto driver payouts, platform take-rate revenue, and completed trips.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Platform Fee Net</span>
                <div className="font-bold font-mono text-blue-600 text-sm">₹1,15,194</div>
              </div>
              <div className="text-right border-l border-slate-200 pl-4">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Driver Earnings</span>
                <div className="font-bold font-mono text-emerald-600 text-sm">₹2,04,700</div>
              </div>
              <button
                onClick={() => downloadAdminReport('earnings_week')}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Download last week raw dataset"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={EARNINGS_LAST_WEEK} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: '#475569' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="gmv"
                  name="Gross Merchandise Value (GMV)"
                  fill="#93c5fd"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="driverPayouts"
                  name="Driver Payouts (Transport Fares)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="platformRevenue"
                  name="Platform Revenue (Take-Rate Fee)"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f59e0b' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Table Summary & Insights */}
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-2 text-center text-xs">
            {EARNINGS_LAST_WEEK.map((item) => (
              <div key={item.day} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block text-xs">{item.day}</span>
                <span className="text-[10px] text-slate-400 block font-mono">{item.fullDate.slice(0, 6)}</span>
                <div className="font-bold text-slate-900 mt-1 font-mono text-xs">₹{(item.gmv / 1000).toFixed(0)}k</div>
                <span className="text-[10px] text-emerald-600 font-semibold block">{item.completedTrips} trips</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-950">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Weekly Peak Analysis:</strong> Saturday is the primary stock replenishment surge day (₹2.92 Lakhs GMV, 56 trips). Admin can enable driver standby bonuses on Friday afternoons to pre-empt auto shortages.
              </span>
            </div>
            <span className="font-mono text-blue-800 font-bold shrink-0 bg-blue-100 px-2 py-1 rounded">
              Avg Trip Basket: ₹5,333
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EARNINGS LAST 3 MONTHS GRAPH */}
      {/* ========================================================================= */}
      {(selectedScope === 'all' || selectedScope === 'earnings_3m') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Earnings Last 3 Months (Bi-Weekly Checkpoints: July, August, September)
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  ₹45.46 Lakhs 3-Month GMV
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Quarterly trajectory tracking wholesale transaction volumes, cartons distributed, and driver delivery SLA fulfillment rates.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Volume Handled</span>
                <div className="font-bold font-mono text-slate-800 text-sm">13,390 Cartons</div>
              </div>
              <div className="text-right border-l border-slate-200 pl-4">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Avg Fulfillment</span>
                <div className="font-bold font-mono text-emerald-600 text-sm">99.3%</div>
              </div>
              <button
                onClick={() => downloadAdminReport('earnings_3m')}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Download 3-month dataset"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={EARNINGS_LAST_3_MONTHS} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: '#475569' }}
                />
                <Bar
                  dataKey="gmv"
                  name="Total Gross Merchandise Value (GMV)"
                  fill="#60a5fa"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="driverPayouts"
                  name="Driver Fares Disbursed"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="platformRevenue"
                  name="DeliveryLink Net Take-Rate"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 3-Month Highlights Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">July 2026 Total</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">₹13.30 Lakhs</div>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                +14.2% MoM • 254 completed trips
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">August 2026 Total</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">₹16.80 Lakhs</div>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                +26.3% MoM • 322 completed trips
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">September 2026 (MTD Run-Rate)</span>
              <div className="text-base font-bold text-amber-700 mt-0.5">₹15.36 Lakhs</div>
              <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                Pacing to ₹22.5L+ full month projection
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. EARNINGS LAST YEAR GRAPH */}
      {/* ========================================================================= */}
      {(selectedScope === 'all' || selectedScope === 'earnings_year') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  4
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Earnings Last Year (12-Month Trajectory: Oct 2025 - Sep 2026)
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  ₹1.66 Crore Annual GMV
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Full-year financial progression correlating monthly FMCG demand waves, festival restocking spikes, and platform scalability.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Annual Net Commission</span>
                <div className="font-bold font-mono text-slate-900 text-sm">₹12.45 Lakhs</div>
              </div>
              <div className="text-right border-l border-slate-200 pl-4">
                <span className="text-[10px] text-slate-400 uppercase font-medium">YoY Expansion Rate</span>
                <div className="font-bold font-mono text-emerald-600 text-sm">+41.2%</div>
              </div>
              <button
                onClick={() => downloadAdminReport('earnings_year')}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Download 1-year historical dataset"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={EARNINGS_LAST_YEAR} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="annualGmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: '#475569' }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="gmv"
                  name="Gross Merchandise Value (GMV)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#annualGmvGrad)"
                />
                <Bar
                  yAxisId="left"
                  dataKey="driverPayouts"
                  name="Annual Driver Payouts"
                  fill="#10b981"
                  barSize={18}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="growthYoY"
                  name="YoY Growth % Velocity"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f43f5e' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Quarterly Cohort Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Q4 2025 (Oct-Dec)</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">₹31.7 Lakhs GMV</div>
              <span className="text-[10px] text-slate-500 block">Diwali & Year-End Surge</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Q1 2026 (Jan-Mar)</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">₹37.4 Lakhs GMV</div>
              <span className="text-[10px] text-slate-500 block">Sankranti & FY-End</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Q2 2026 (Apr-Jun)</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">₹44.1 Lakhs GMV</div>
              <span className="text-[10px] text-slate-500 block">Beverages & Confectionery</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-emerald-700 block text-[10px] uppercase font-bold">Q3 2026 (Jul-Sep)</span>
              <div className="text-sm font-bold text-emerald-950 mt-0.5">₹53.5 Lakhs GMV</div>
              <span className="text-[10px] text-emerald-700 font-semibold block">Pre-Dussehra Peak (+41.2%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
