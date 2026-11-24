import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import {
  Bell,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

export const CustomerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await api.get('/portal/notifications');
        if (res.success) {
          setNotifications(res.notifications || []);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* 1. Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Bell className="w-6 h-6 text-sky-600 mr-2" />
            Order Updates &amp; Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of manufacturing events, drawing reviews, and commercial milestones.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500">
          Showing: <strong className="text-slate-900">{notifications.length} Event(s)</strong>
        </span>
      </div>

      {/* 2. Timeline List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading notifications feed...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No notification events logged yet. Important milestones on your orders will be listed here.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {notifications.map((n, idx) => (
              <div key={idx} className="relative flex items-start space-x-3">
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{n.orderNumber}</span>
                      <span className="text-xs font-bold text-slate-900">{n.event}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(n.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{n.notes}</p>
                  <span className="text-[10px] text-slate-400 block pt-0.5 font-medium">
                    Project: {n.projectTitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
