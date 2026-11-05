import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Activity, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none shadow-xs">
      {/* Left: System ID */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-extrabold text-[#1E3A5F] tracking-tight">
            SKY POWER ERP
          </span>
        </div>
        <span className="text-slate-300">|</span>
        <span className="text-xs font-semibold text-[#1E5BB8] bg-[#F0F5FD] border border-[#D0E1F9] px-2.5 py-1 rounded-full">
          Sales &amp; Marketing
        </span>
      </div>

      {/* Center: Live Plant Clock */}
      <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-100/80 border border-slate-200 px-3.5 py-1 rounded-full">
        <Activity className="w-4 h-4 text-[#EE6F2D]" />
        <span className="font-semibold">{timeStr}</span>
      </div>

      {/* Right: Role Clearance & Profile */}
      <div className="flex items-center space-x-3">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${
            isAdmin
              ? 'bg-[#FFF5EE] text-[#EE6F2D] border border-[#FCDCC9]'
              : 'bg-[#F0F5FD] text-[#1E5BB8] border border-[#D0E1F9]'
          }`}
        >
          {isAdmin ? 'Admin Console' : 'Sales Engineer'}
        </span>

        {/* User Profile */}
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center space-x-2 px-2.5 py-1 rounded-full text-slate-800 hover:text-[#1E5BB8] hover:bg-slate-100 cursor-pointer transition-all duration-200"
          title="Profile"
        >
          <div className="w-7 h-7 rounded-full bg-[#1E5BB8] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="text-sm font-semibold hidden sm:inline max-w-[130px] truncate text-slate-800">
            {user?.name}
          </span>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
