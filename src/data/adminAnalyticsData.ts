export interface DailyUserData {
  date: string;
  dayNumber: number;
  totalUsers: number;
  newUsers: number;
  shopkeepers: number;
  drivers: number;
  distributors: number;
  activeSessions: number;
}

export interface WeeklyEarningsData {
  day: string;
  fullDate: string;
  gmv: number;
  platformRevenue: number;
  driverPayouts: number;
  completedTrips: number;
  avgTripValue: number;
}

export interface MonthlyEarningsData {
  period: string;
  month: string;
  gmv: number;
  platformRevenue: number;
  driverPayouts: number;
  trips: number;
  volumeCartons: number;
  fulfillmentRate: number;
}

export interface YearlyEarningsData {
  month: string;
  quarter: string;
  gmv: number;
  platformRevenue: number;
  driverPayouts: number;
  trips: number;
  growthYoY: number;
  fmcgSeason: string;
}

export interface StrategicRecommendation {
  id: string;
  category: 'supply' | 'pricing' | 'growth' | 'efficiency';
  severity: 'urgent' | 'opportunity' | 'insight';
  title: string;
  metric: string;
  impact: string;
  action: string;
  recommendedValue?: number;
}

// 1. Users Last 30 Days (Daily time-series)
export const USERS_LAST_30_DAYS: DailyUserData[] = [
  { date: 'Aug 17', dayNumber: 1, totalUsers: 1140, newUsers: 6, shopkeepers: 4, drivers: 1, distributors: 1, activeSessions: 420 },
  { date: 'Aug 18', dayNumber: 2, totalUsers: 1148, newUsers: 8, shopkeepers: 5, drivers: 2, distributors: 1, activeSessions: 445 },
  { date: 'Aug 19', dayNumber: 3, totalUsers: 1155, newUsers: 7, shopkeepers: 5, drivers: 2, distributors: 0, activeSessions: 430 },
  { date: 'Aug 20', dayNumber: 4, totalUsers: 1164, newUsers: 9, shopkeepers: 6, drivers: 3, distributors: 0, activeSessions: 480 },
  { date: 'Aug 21', dayNumber: 5, totalUsers: 1175, newUsers: 11, shopkeepers: 7, drivers: 3, distributors: 1, activeSessions: 512 },
  { date: 'Aug 22', dayNumber: 6, totalUsers: 1184, newUsers: 9, shopkeepers: 6, drivers: 2, distributors: 1, activeSessions: 495 },
  { date: 'Aug 23', dayNumber: 7, totalUsers: 1190, newUsers: 6, shopkeepers: 4, drivers: 2, distributors: 0, activeSessions: 390 },
  { date: 'Aug 24', dayNumber: 8, totalUsers: 1198, newUsers: 8, shopkeepers: 5, drivers: 2, distributors: 1, activeSessions: 470 },
  { date: 'Aug 25', dayNumber: 9, totalUsers: 1209, newUsers: 11, shopkeepers: 7, drivers: 3, distributors: 1, activeSessions: 510 },
  { date: 'Aug 26', dayNumber: 10, totalUsers: 1219, newUsers: 10, shopkeepers: 6, drivers: 3, distributors: 1, activeSessions: 525 },
  { date: 'Aug 27', dayNumber: 11, totalUsers: 1227, newUsers: 8, shopkeepers: 5, drivers: 2, distributors: 1, activeSessions: 502 },
  { date: 'Aug 28', dayNumber: 12, totalUsers: 1238, newUsers: 11, shopkeepers: 7, drivers: 3, distributors: 1, activeSessions: 540 },
  { date: 'Aug 29', dayNumber: 13, totalUsers: 1251, newUsers: 13, shopkeepers: 9, drivers: 3, distributors: 1, activeSessions: 565 },
  { date: 'Aug 30', dayNumber: 14, totalUsers: 1259, newUsers: 8, shopkeepers: 5, drivers: 2, distributors: 1, activeSessions: 430 },
  { date: 'Aug 31', dayNumber: 15, totalUsers: 1269, newUsers: 10, shopkeepers: 6, drivers: 3, distributors: 1, activeSessions: 520 },
  { date: 'Sep 01', dayNumber: 16, totalUsers: 1284, newUsers: 15, shopkeepers: 10, drivers: 4, distributors: 1, activeSessions: 610 },
  { date: 'Sep 02', dayNumber: 17, totalUsers: 1296, newUsers: 12, shopkeepers: 8, drivers: 3, distributors: 1, activeSessions: 590 },
  { date: 'Sep 03', dayNumber: 18, totalUsers: 1307, newUsers: 11, shopkeepers: 7, drivers: 3, distributors: 1, activeSessions: 575 },
  { date: 'Sep 04', dayNumber: 19, totalUsers: 1320, newUsers: 13, shopkeepers: 8, drivers: 4, distributors: 1, activeSessions: 620 },
  { date: 'Sep 05', dayNumber: 20, totalUsers: 1335, newUsers: 15, shopkeepers: 9, drivers: 5, distributors: 1, activeSessions: 645 },
  { date: 'Sep 06', dayNumber: 21, totalUsers: 1344, newUsers: 9, shopkeepers: 6, drivers: 2, distributors: 1, activeSessions: 480 },
  { date: 'Sep 07', dayNumber: 22, totalUsers: 1356, newUsers: 12, shopkeepers: 7, drivers: 4, distributors: 1, activeSessions: 595 },
  { date: 'Sep 08', dayNumber: 23, totalUsers: 1370, newUsers: 14, shopkeepers: 9, drivers: 4, distributors: 1, activeSessions: 640 },
  { date: 'Sep 09', dayNumber: 24, totalUsers: 1386, newUsers: 16, shopkeepers: 10, drivers: 5, distributors: 1, activeSessions: 680 },
  { date: 'Sep 10', dayNumber: 25, totalUsers: 1400, newUsers: 14, shopkeepers: 8, drivers: 5, distributors: 1, activeSessions: 660 },
  { date: 'Sep 11', dayNumber: 26, totalUsers: 1415, newUsers: 15, shopkeepers: 9, drivers: 5, distributors: 1, activeSessions: 690 },
  { date: 'Sep 12', dayNumber: 27, totalUsers: 1432, newUsers: 17, shopkeepers: 11, drivers: 5, distributors: 1, activeSessions: 720 },
  { date: 'Sep 13', dayNumber: 28, totalUsers: 1442, newUsers: 10, shopkeepers: 6, drivers: 3, distributors: 1, activeSessions: 530 },
  { date: 'Sep 14', dayNumber: 29, totalUsers: 1456, newUsers: 14, shopkeepers: 9, drivers: 4, distributors: 1, activeSessions: 670 },
  { date: 'Sep 15', dayNumber: 30, totalUsers: 1472, newUsers: 16, shopkeepers: 10, drivers: 5, distributors: 1, activeSessions: 710 },
];

// 2. Earnings Last Week (Monday through Sunday)
export const EARNINGS_LAST_WEEK: WeeklyEarningsData[] = [
  { day: 'Mon', fullDate: '09 Sep 2026', gmv: 184500, platformRevenue: 13840, driverPayouts: 24600, completedTrips: 34, avgTripValue: 5426 },
  { day: 'Tue', fullDate: '10 Sep 2026', gmv: 198200, platformRevenue: 14865, driverPayouts: 26400, completedTrips: 37, avgTripValue: 5356 },
  { day: 'Wed', fullDate: '11 Sep 2026', gmv: 215400, platformRevenue: 16155, driverPayouts: 28700, completedTrips: 41, avgTripValue: 5253 },
  { day: 'Thu', fullDate: '12 Sep 2026', gmv: 228900, platformRevenue: 17167, driverPayouts: 30500, completedTrips: 43, avgTripValue: 5323 },
  { day: 'Fri', fullDate: '13 Sep 2026', gmv: 274300, platformRevenue: 20572, driverPayouts: 36600, completedTrips: 52, avgTripValue: 5275 },
  { day: 'Sat', fullDate: '14 Sep 2026', gmv: 292000, platformRevenue: 21900, driverPayouts: 38900, completedTrips: 56, avgTripValue: 5214 },
  { day: 'Sun', fullDate: '15 Sep 2026', gmv: 142600, platformRevenue: 10695, driverPayouts: 19000, completedTrips: 26, avgTripValue: 5484 },
];

// 3. Earnings Last 3 Months (Bi-weekly checkpoints across July, August, September)
export const EARNINGS_LAST_3_MONTHS: MonthlyEarningsData[] = [
  { period: 'Jul W1-2', month: 'July', gmv: 620000, platformRevenue: 46500, driverPayouts: 82500, trips: 118, volumeCartons: 1820, fulfillmentRate: 98.2 },
  { period: 'Jul W3-4', month: 'July', gmv: 710000, platformRevenue: 53250, driverPayouts: 94600, trips: 136, volumeCartons: 2090, fulfillmentRate: 98.8 },
  { period: 'Aug W1-2', month: 'August', gmv: 795000, platformRevenue: 59625, driverPayouts: 106000, trips: 152, volumeCartons: 2340, fulfillmentRate: 99.1 },
  { period: 'Aug W3-4', month: 'August', gmv: 885000, platformRevenue: 66375, driverPayouts: 118000, trips: 170, volumeCartons: 2610, fulfillmentRate: 99.4 },
  { period: 'Sep W1-2', month: 'September', gmv: 980000, platformRevenue: 73500, driverPayouts: 130500, trips: 188, volumeCartons: 2890, fulfillmentRate: 99.6 },
  { period: 'Sep W3 (MTD)', month: 'September', gmv: 556000, platformRevenue: 41700, driverPayouts: 74100, trips: 107, volumeCartons: 1640, fulfillmentRate: 99.7 },
];

// 4. Earnings Last Year (12 Months, Oct 2025 - Sep 2026)
export const EARNINGS_LAST_YEAR: YearlyEarningsData[] = [
  { month: 'Oct 2025', quarter: 'Q4 2025', gmv: 940000, platformRevenue: 70500, driverPayouts: 125000, trips: 195, growthYoY: 18.2, fmcgSeason: 'Dussehra & Diwali Stocking' },
  { month: 'Nov 2025', quarter: 'Q4 2025', gmv: 1080000, platformRevenue: 81000, driverPayouts: 144000, trips: 224, growthYoY: 21.5, fmcgSeason: 'Diwali Festival Peak' },
  { month: 'Dec 2025', quarter: 'Q4 2025', gmv: 1150000, platformRevenue: 86250, driverPayouts: 153000, trips: 238, growthYoY: 24.1, fmcgSeason: 'Year-End Retail Rush' },
  { month: 'Jan 2026', quarter: 'Q1 2026', gmv: 1240000, platformRevenue: 93000, driverPayouts: 165000, trips: 254, growthYoY: 26.3, fmcgSeason: 'Sankranti / Pongal Harvest' },
  { month: 'Feb 2026', quarter: 'Q1 2026', gmv: 1190000, platformRevenue: 89250, driverPayouts: 158500, trips: 242, growthYoY: 22.8, fmcgSeason: 'Regular FMCG Cycle' },
  { month: 'Mar 2026', quarter: 'Q1 2026', gmv: 1310000, platformRevenue: 98250, driverPayouts: 174500, trips: 268, growthYoY: 25.4, fmcgSeason: 'Financial Year-End Dispatches' },
  { month: 'Apr 2026', quarter: 'Q2 2026', gmv: 1420000, platformRevenue: 106500, driverPayouts: 189000, trips: 290, growthYoY: 28.7, fmcgSeason: 'Summer Beverages Surge' },
  { month: 'May 2026', quarter: 'Q2 2026', gmv: 1530000, platformRevenue: 114750, driverPayouts: 204000, trips: 312, growthYoY: 31.0, fmcgSeason: 'Summer Peak Staples' },
  { month: 'Jun 2026', quarter: 'Q2 2026', gmv: 1460000, platformRevenue: 109500, driverPayouts: 194500, trips: 298, growthYoY: 27.5, fmcgSeason: 'Monsoon Replenishment' },
  { month: 'Jul 2026', quarter: 'Q3 2026', gmv: 1620000, platformRevenue: 121500, driverPayouts: 216000, trips: 332, growthYoY: 33.4, fmcgSeason: 'Bonalu & Shravan Festive' },
  { month: 'Aug 2026', quarter: 'Q3 2026', gmv: 1780000, platformRevenue: 133500, driverPayouts: 237000, trips: 364, growthYoY: 36.8, fmcgSeason: 'Vinayaka Chavithi Stocking' },
  { month: 'Sep 2026', quarter: 'Q3 2026', gmv: 1950000, platformRevenue: 146250, driverPayouts: 260000, trips: 398, growthYoY: 41.2, fmcgSeason: 'Pre-Dussehra Mega Replenishment' },
];

// Strategic Decision Intelligence & Actionable Insights
export const STRATEGIC_RECOMMENDATIONS: StrategicRecommendation[] = [
  {
    id: 'rec-1',
    category: 'supply',
    severity: 'urgent',
    title: 'Auto Driver Supply Deficit in Dilsukhnagar & LB Nagar',
    metric: '9:00 AM - 12:30 PM Peak Hours',
    impact: 'Average trip allocation time increased by 18 mins; 6 pending wholesaler dispatches delayed',
    action: 'Activate dynamic +₹40 surge incentive for drivers accepting 3+ multi-stop routes in Zone 4',
    recommendedValue: 40,
  },
  {
    id: 'rec-2',
    category: 'efficiency',
    severity: 'opportunity',
    title: 'High Mileage Savings from 4-Stop Delivery Route Grouping',
    metric: '24.6% Kilometers Saved',
    impact: 'Consolidated milk-runs saved ₹1,820/day in driver fuel and boosted driver daily net profit to ₹1,450',
    action: 'Set minimum stop grouping threshold to 3 stores for Begum Bazar wholesale godowns',
  },
  {
    id: 'rec-3',
    category: 'growth',
    severity: 'opportunity',
    title: 'Retailer Replenishment Surge in Charminar & Old City',
    metric: '+34% Order Volume Month-over-Month',
    impact: '82 new kirana store owners registered; high demand for branded edible oils and packaged confectionery',
    action: 'Onboard 4 additional FMCG bulk stockists in Katedan Industrial Area to service this corridor',
  },
  {
    id: 'rec-4',
    category: 'pricing',
    severity: 'insight',
    title: 'Fare Elasticity Analysis in Commercial Corridors',
    metric: '₹25/km base rate vs ₹28/km market median',
    impact: 'Driver acceptance rate is 94.2%; bumping base fare by ₹20 will increase driver retention without shopkeeper churn',
    action: 'Test +₹20 base fare adjustment in Corridor B (Secunderabad - Malkajgiri)',
    recommendedValue: 270,
  },
];

// User demographic breakdown
export const USER_DEMOGRAPHICS = [
  { role: 'Kirana & Retail Stores', count: 984, percentage: 67, color: '#10b981', fill: '#10b981' },
  { role: 'Verified Auto Drivers', count: 342, percentage: 23, color: '#f59e0b', fill: '#f59e0b' },
  { role: 'FMCG Wholesale Distributors', count: 146, percentage: 10, color: '#3b82f6', fill: '#3b82f6' },
];

// Audit trail events
export const RECENT_AUDIT_LOGS = [
  { id: 'log-1', timestamp: '10 mins ago', event: 'Driver Approved', actor: 'Admin Ops', details: 'Approved DL & RC for driver Ramesh Yadav (TS 09 UA 4521)', type: 'verification' },
  { id: 'log-2', timestamp: '24 mins ago', event: 'e-PoD Bill Uploaded', actor: 'Venkat Reddy (SHP-1204)', details: 'Signed bill photo uploaded for Stop #1 in TRIP-8801. OTP Unlocked.', type: 'delivery' },
  { id: 'log-3', timestamp: '1 hour ago', event: 'Fare Rule Updated', actor: 'Admin Ops', details: 'Updated base fare to ₹250 & per stop fee to ₹40', type: 'pricing' },
  { id: 'log-4', timestamp: '2 hours ago', event: 'New Distributor Onboarded', actor: 'System', details: 'Sri Balaji FMCG Wholesalers verified with GSTIN', type: 'user' },
  { id: 'log-5', timestamp: '3 hours ago', event: 'Multi-Stop Route Optimized', actor: 'AI Route Engine', details: 'Optimized 3 stops for TRIP-8801 saving 4.8 km and 18 mins', type: 'system' },
];
