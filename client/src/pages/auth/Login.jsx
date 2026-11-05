import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('admin@skypower.co.in');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/sales/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setAdminCredentials = () => {
    setEmail('admin@skypower.co.in');
    setPassword('Admin@123');
    setError('');
  };

  const setSalesCredentials = () => {
    setEmail('sales@skypower.co.in');
    setPassword('Sales@123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-12 px-4 selection:bg-[#1E5BB8] selection:text-white relative">
      {/* Subtle modern background grid */}
      <div 
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #1E3A5F 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 transition-all duration-300">
          {/* Logo & Minimal Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-2 bg-white rounded-xl shadow-md border border-slate-100 mb-3 hover:scale-105 transition-transform duration-300">
              <img
                src="/brand-logo.jpg"
                alt="Sky Power Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <div className="flex items-center justify-center text-2xl font-black tracking-tight">
              <span className="text-[#1E5BB8]">SKY</span>
              <span className="text-[#EE6F2D] ml-1.5">POWER</span>
            </div>
            <p className="text-xs font-semibold text-[#1E3A5F] mt-0.5 tracking-wide">
              Switch to the Future
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@skypower.co.in"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1E5BB8] focus:ring-2 focus:ring-[#1E5BB8]/15 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Access Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1E5BB8] focus:ring-2 focus:ring-[#1E5BB8]/15 transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-bold btn-primary disabled:opacity-50 mt-3 tracking-wide"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Role Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-wider text-center mb-3 font-bold">
              Instant Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={setAdminCredentials}
                className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#FFF5EE] hover:bg-[#FFE8D6] text-[#EE6F2D] border border-[#FCDCC9] rounded-lg text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs"
              >
                <Zap className="w-4 h-4 text-[#EE6F2D]" />
                <span>Admin Login</span>
              </button>

              <button
                type="button"
                onClick={setSalesCredentials}
                className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#F0F5FD] hover:bg-[#DCE9FA] text-[#1E5BB8] border border-[#D0E1F9] rounded-lg text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-[#1E5BB8]" />
                <span>Sales Login</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Module 01: Marketing &amp; Sales Management System
        </p>
      </div>
    </div>
  );
};
