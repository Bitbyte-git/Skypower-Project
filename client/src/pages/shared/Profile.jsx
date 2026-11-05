import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Mail, Phone, Building2, Calendar } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Account Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Your authenticated identity and corporate access credentials in the ERP.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
        <div className="flex items-center space-x-4 border-b border-slate-100 pb-5">
          <div className="w-16 h-16 rounded-full bg-[#111827] text-white flex items-center justify-center font-bold text-xl shadow-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.department || 'Marketing & Sales'}</p>
            <span
              className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                user?.role === 'ADMIN'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}
            >
              Role: {user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Corporate Email</span>
            <p className="font-mono font-bold text-slate-800 mt-0.5">{user?.email}</p>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Official Phone</span>
            <p className="font-mono font-bold text-slate-800 mt-0.5">{user?.phone || 'Not Registered'}</p>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Department</span>
            <p className="font-semibold text-slate-800 mt-0.5">{user?.department || 'Marketing & Sales'}</p>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Last Authenticated</span>
            <p className="text-slate-700 mt-0.5">
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'Current Session'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

