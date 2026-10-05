import {
  USERS_LAST_30_DAYS,
  EARNINGS_LAST_WEEK,
  EARNINGS_LAST_3_MONTHS,
  EARNINGS_LAST_YEAR,
} from '../data/adminAnalyticsData';

/**
 * Generates and triggers download of CSV reports for the Admin
 */
export function downloadAdminReport(reportType: 'users_30d' | 'earnings_week' | 'earnings_3m' | 'earnings_year' | 'full_executive_summary') {
  let csvContent = '';
  let fileName = `DeliveryLink_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

  if (reportType === 'users_30d') {
    csvContent = 'Day Number,Date,Total Users,New Users,Retailers / Kiranas,Auto Drivers,FMCG Distributors,Active Sessions\n';
    USERS_LAST_30_DAYS.forEach((row) => {
      csvContent += `${row.dayNumber},"${row.date}",${row.totalUsers},${row.newUsers},${row.shopkeepers},${row.drivers},${row.distributors},${row.activeSessions}\n`;
    });
  } else if (reportType === 'earnings_week') {
    csvContent = 'Day,Date,Gross Merchandise Value (INR),Platform Revenue (INR),Driver Payouts (INR),Completed Trips,Average Trip Value (INR)\n';
    EARNINGS_LAST_WEEK.forEach((row) => {
      csvContent += `"${row.day}","${row.fullDate}",${row.gmv},${row.platformRevenue},${row.driverPayouts},${row.completedTrips},${row.avgTripValue}\n`;
    });
  } else if (reportType === 'earnings_3m') {
    csvContent = 'Period,Month,Gross Merchandise Value (INR),Platform Revenue (INR),Driver Payouts (INR),Trips,Volume Cartons,Fulfillment Rate (%)\n';
    EARNINGS_LAST_3_MONTHS.forEach((row) => {
      csvContent += `"${row.period}","${row.month}",${row.gmv},${row.platformRevenue},${row.driverPayouts},${row.trips},${row.volumeCartons},${row.fulfillmentRate}\n`;
    });
  } else if (reportType === 'earnings_year') {
    csvContent = 'Month,Quarter,Gross Merchandise Value (INR),Platform Revenue (INR),Driver Payouts (INR),Trips,YoY Growth (%),FMCG Seasonal Factor\n';
    EARNINGS_LAST_YEAR.forEach((row) => {
      csvContent += `"${row.month}","${row.quarter}",${row.gmv},${row.platformRevenue},${row.driverPayouts},${row.trips},${row.growthYoY},"${row.fmcgSeason}"\n`;
    });
  } else {
    // Full Executive Consolidated Summary
    csvContent = '=== DELIVERYLINK OPERATIONS & FINANCIAL EXECUTIVE BRIEF ===\n';
    csvContent += `Generated On: ${new Date().toLocaleString('en-IN')}\n`;
    csvContent += 'Zone: Hyderabad FMCG Wholesale Corridor (Begum Bazar / Katedan)\n\n';

    csvContent += '--- 1. USERS LAST 30 DAYS SUMMARY ---\n';
    csvContent += 'Date,Total Users,New Users,Shopkeepers,Drivers,Distributors\n';
    USERS_LAST_30_DAYS.slice(-7).forEach((r) => {
      csvContent += `"${r.date}",${r.totalUsers},${r.newUsers},${r.shopkeepers},${r.drivers},${r.distributors}\n`;
    });

    csvContent += '\n--- 2. EARNINGS LAST WEEK ---\n';
    csvContent += 'Day,Date,GMV (INR),Platform Revenue (INR),Driver Payouts (INR),Trips\n';
    EARNINGS_LAST_WEEK.forEach((r) => {
      csvContent += `"${r.day}","${r.fullDate}",${r.gmv},${r.platformRevenue},${r.driverPayouts},${r.completedTrips}\n`;
    });

    csvContent += '\n--- 3. EARNINGS LAST 3 MONTHS ---\n';
    csvContent += 'Period,Month,GMV (INR),Platform Revenue (INR),Driver Payouts (INR),Trips,Fulfillment %\n';
    EARNINGS_LAST_3_MONTHS.forEach((r) => {
      csvContent += `"${r.period}","${r.month}",${r.gmv},${r.platformRevenue},${r.driverPayouts},${r.trips},${r.fulfillmentRate}%\n`;
    });

    csvContent += '\n--- 4. ANNUAL FINANCIAL RUN-RATE ---\n';
    csvContent += 'Month,Quarter,GMV (INR),Platform Revenue (INR),Driver Payouts (INR),YoY Growth\n';
    EARNINGS_LAST_YEAR.forEach((r) => {
      csvContent += `"${r.month}","${r.quarter}",${r.gmv},${r.platformRevenue},${r.driverPayouts},${r.growthYoY}%\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
