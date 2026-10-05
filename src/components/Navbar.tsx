import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Truck, Bell, Shield, Store, Building2, Power } from 'lucide-react';

interface NavbarProps {
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications }) => {
  const { currentUser, switchRole, driverIsOnline, toggleDriverOnline, notifications } = useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleConfigs: { role: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { role: 'distributor', label: 'Distributor', icon: <Building2 className="w-4 h-4" />, color: 'bg-indigo-600' },
    { role: 'driver', label: 'Auto Driver', icon: <Truck className="w-4 h-4" />, color: 'bg-amber-600' },
    { role: 'shopkeeper', label: 'Shopkeeper', icon: <Store className="w-4 h-4" />, color: 'bg-emerald-600' },
    { role: 'admin', label: 'Operations Admin', icon: <Shield className="w-4 h-4" />, color: 'bg-rose-600' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">DeliveryLink</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  FMCG Marketplace
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Wholesale to Kirana Multi-Stop Logistics</p>
            </div>
          </div>

          {/* Quick Role Switcher Bar */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {roleConfigs.map(({ role, label, icon }) => {
              const isActive = currentUser.role === role;
              return (
                <button
                  key={role}
                  id={`role-btn-${role}`}
                  onClick={() => switchRole(role)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {icon}
                  <span className="hidden md:inline">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Driver online toggle if current role is driver */}
            {currentUser.role === 'driver' && (
              <button
                id="driver-online-toggle"
                onClick={toggleDriverOnline}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  driverIsOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <Power className={`w-3.5 h-3.5 ${driverIsOnline ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="font-semibold">{driverIsOnline ? 'Online' : 'Offline'}</span>
              </button>
            )}

            {/* Notifications Bell */}
            <button
              id="notifications-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                  {currentUser.fullName}
                </div>
                <div className="text-slate-500 font-mono text-[11px]">{currentUser.userCode}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
