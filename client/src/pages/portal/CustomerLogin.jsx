import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Phone,
  HelpCircle,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

export const CustomerLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [generatedResetToken, setGeneratedResetToken] = useState('');

  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use portal auth endpoint
      const res = await api.post('/portal/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });

      if (res.success && res.token) {
        localStorage.setItem('erp_token', res.token);
        localStorage.setItem('erp_user', JSON.stringify(res.user));
        // Force reload or redirect to portal dashboard
        window.location.href = '/portal/dashboard';
      } else {
        setError(res.message || 'Invalid credentials.');
      }
    } catch (err) {
      setError(err.message || 'Customer authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotSuccess('');
    setError('');

    try {
      const res = await api.post('/portal/auth/forgot-password', { email: forgotEmail });
      if (res.success) {
        setForgotSuccess(res.message);
        if (res.resetToken) {
          setGeneratedResetToken(res.resetToken);
        }
      }
    } catch (err) {
      alert('Error requesting password reset: ' + err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetSuccess('');

    try {
      const res = await api.post('/portal/auth/reset-password', {
        token: resetToken,
        password: newPassword
      });
      if (res.success) {
        setResetSuccess(res.message);
        setTimeout(() => {
          setShowResetModal(false);
          setShowForgotModal(false);
          setPassword('');
        }, 2500);
      }
    } catch (err) {
      alert('Error resetting password: ' + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center py-12 px-4 selection:bg-[#062B59] selection:text-white relative"
      style={{ background: 'linear-gradient(135deg, #0A192F 0%, #0F325E 50%, #092040 100%)' }}
    >
      {/* Decorative background grid */}
      <div
        className="fixed inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '28px 28px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-xl mb-3">
            <span
              className="text-2xl font-black bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #062B59 0%, #0878C9 100%)' }}
            >
              SP
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">SKY POWER SWITCHGEARS</h1>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold mt-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Authorized Customer Portal</span>
          </div>
          <p className="text-xs text-slate-300 mt-2">
            Track switchgear manufacturing, review drawings, and monitor delivery schedules.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Customer Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your registered corporate email address and password.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Corporate Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@clientcompany.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Password *</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">Remember on this device</span>
              </label>
              <Link
                to="/customer/activate"
                className="text-[11px] font-bold text-slate-500 hover:text-blue-600 hover:underline"
              >
                Activate Account
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 cursor-pointer"
              style={{ background: 'linear-gradient(90deg, #062B59 0%, #0878C9 100%)' }}
            >
              <span>{loading ? 'Authenticating Customer Portal...' : 'Access Customer Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch to Employee Login */}
          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Sky Power Engineer or Internal Staff?{' '}
              <Link to="/login" className="font-bold text-blue-600 hover:underline">
                Employee ERP Login →
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Support Info */}
        <div className="mt-6 text-center text-xs text-slate-400 space-y-1">
          <p>Need access or forgot your credentials? Contact your Sky Power Sales Representative.</p>
          <p className="text-[11px] text-slate-500">Works &amp; Delivery Support: +91 98401 98401 • support@skypower.co.in</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Reset Customer Portal Password</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess('');
                  setGeneratedResetToken('');
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Instructions Sent!</span>
                  </div>
                  <p className="text-xs text-slate-600">{forgotSuccess}</p>
                  {generatedResetToken && (
                    <div className="pt-2 text-xs">
                      <span className="text-slate-400 block text-[10px] font-mono">Reset Token (Demo Mode):</span>
                      <span className="font-mono bg-white p-2 rounded border border-emerald-200 block text-slate-800 break-all select-all">
                        {generatedResetToken}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setResetToken(generatedResetToken);
                          setShowResetModal(true);
                        }}
                        className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                      >
                        Click here to set new password now →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Enter your registered customer email address to receive password reset instructions.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="contact@clientcompany.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    {forgotLoading ? 'Processing...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Set New Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Set New Password</h3>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{resetSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reset Token</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password (min 6 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    {resetLoading ? 'Updating...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
