import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, X, Check, Truck, Package, Store, AlertCircle } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Activity & Alerts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications list */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {notifications.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">No notifications yet</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  notif.read
                    ? 'bg-white border-slate-100 opacity-70'
                    : 'bg-blue-50/50 border-blue-200'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  {notif.type === 'trip' || notif.type === 'delivery' ? (
                    <Truck className="w-4 h-4" />
                  ) : notif.type === 'order' ? (
                    <Package className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                    <span className="text-[10px] text-slate-400">{notif.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
