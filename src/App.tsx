import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DistributorView } from './components/DistributorView';
import { DriverView } from './components/DriverView';
import { ShopkeeperView } from './components/ShopkeeperView';
import { AdminView } from './components/AdminView';
import { NotificationsModal } from './components/NotificationsModal';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const { currentUser, toast, switchRole } = useApp();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toast}</span>
        </div>
      )}

      {/* Top Navbar with quick role switcher */}
      <Navbar onOpenNotifications={() => setIsNotificationsOpen(true)} />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser.role === 'distributor' && <DistributorView />}
        {currentUser.role === 'driver' && <DriverView />}
        {currentUser.role === 'shopkeeper' && <ShopkeeperView />}
        {currentUser.role === 'admin' && <AdminView />}
      </main>

      {/* Notifications Drawer/Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Footer Info */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">DeliveryLink Logistics</span>
            <span>•</span>
            <span>FMCG Wholesale to Kirana Multi-Stop Marketplace</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Current Role Mode:</span>
            <span className="capitalize font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {currentUser.role}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
