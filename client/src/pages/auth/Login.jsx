import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, Zap, ShieldCheck, ClipboardList } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('sales@skypower.co.in');
  const [password, setPassword] = useState('Sales@123');
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
      } else if (loggedUser.role === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/workflow');
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

  const setManagerCredentials = () => {
    setEmail('manager@skypower.co.in');
    setPassword('Manager@123');
    setError('');
  };

  const setSalesCredentials = () => {
    setEmail('sales@skypower.co.in');
    setPassword('Sales@123');
    setError('');
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center py-12 px-4 selection:bg-[#062B59] selection:text-white relative"
      style={{ background: 'linear-gradient(135deg, #F8FBFF 0%, #EEF5FD 55%, #E7F1FC 100%)' }}
    >
      {/* Subtle modern background grid */}
      <div 
        className="fixed inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #062B59 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div
          className="bg-white p-8 rounded-2xl border transition-all duration-300"
          style={{
            borderColor: '#DCE7F3',
            boxShadow: '0 20px 60px rgba(6, 43, 89, 0.10), 0 4px 16px rgba(6, 43, 89, 0.05)'
          }}
        >
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-2 bg-white rounded-xl shadow-md border border-slate-100 mb-3 hover:scale-105 transition-transform duration-300">
              <img
                src="/brand-logo.jpg"
                alt="Sky Power Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <div className="flex items-center justify-center text-2xl font-black tracking-tight">
              <span style={{ color: '#0878C9' }}>SKY</span>
              <span style={{ color: '#FF7A18' }} className="ml-1.5">POWER</span>
            </div>
            <p className="text-xs font-semibold mt-0.5 tracking-wide" style={{ color: '#526783' }}>
              Switch to the Future — Manufacturing ERP
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
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#102B50' }}>
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
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium bg-[#F8FBFF] border rounded-xl placeholder-slate-400 focus:outline-none focus:bg-white transition-all duration-200"
                  style={{ borderColor: '#DCE7F3' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0878C9';
                    e.target.style.boxShadow = '0 0 0 3px rgba(8, 120, 201, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#DCE7F3';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: '#102B50' }}>
                Secure Password
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
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium bg-[#F8FBFF] border rounded-xl placeholder-slate-400 focus:outline-none focus:bg-white transition-all duration-200"
                  style={{ borderColor: '#DCE7F3' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0878C9';
                    e.target.style.boxShadow = '0 0 0 3px rgba(8, 120, 201, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#DCE7F3';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 text-white text-sm font-bold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #0878C9 0%, #062B59 100%)',
                boxShadow: '0 6px 16px rgba(8, 120, 201, 0.30)'
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Role Switcher */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: '#EAF0F7' }}>
            <p className="text-[11px] uppercase tracking-wider text-center mb-3 font-bold" style={{ color: '#8495AB' }}>
              Instant Demo Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={setSalesCredentials}
                className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5"
                style={{
                  background: '#EAF5FF',
                  color: '#0878C9',
                  border: '1px solid #C5DFF5'
                }}
              >
                <ShieldCheck className="w-4 h-4 mb-0.5" style={{ color: '#0878C9' }} />
                <span>Sales Login</span>
              </button>

              <button
                type="button"
                onClick={setManagerCredentials}
                className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5"
                style={{
                  background: '#F5F3FF',
                  color: '#7C3AED',
                  border: '1px solid #DDD6FE'
                }}
              >
                <ClipboardList className="w-4 h-4 mb-0.5" style={{ color: '#7C3AED' }} />
                <span>Manager</span>
              </button>

              <button
                type="button"
                onClick={setAdminCredentials}
                className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5"
                style={{
                  background: '#FFF0E3',
                  color: '#EA6208',
                  border: '1px solid #FFD4A8'
                }}
              >
                <Zap className="w-4 h-4 mb-0.5" style={{ color: '#EA6208' }} />
                <span>Admin Login</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px]" style={{ color: '#8495AB' }}>
          Sky Power Switchgears • Manufacturing ERP
        </p>
      </div>
    </div>
  );
};
