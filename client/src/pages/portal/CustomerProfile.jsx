import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react';

export const CustomerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable Contact State
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [officePhone, setOfficePhone] = useState('');
  const [website, setWebsite] = useState('');
  const [updatingContact, setUpdatingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/portal/profile');
      if (res.success) {
        setProfile(res.profile);
        setContactPerson(res.profile.contactPerson || '');
        setMobile(res.profile.mobile || '');
        setOfficePhone(res.profile.officePhone || '');
        setWebsite(res.profile.website || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    setContactSuccess('');
    try {
      setUpdatingContact(true);
      const res = await api.put('/portal/profile', {
        contactPerson,
        mobile,
        officePhone,
        website
      });
      if (res.success) {
        setContactSuccess('Contact details updated successfully.');
        setTimeout(() => setContactSuccess(''), 3000);
      }
    } catch (err) {
      alert('Error updating contact: ' + err.message);
    } finally {
      setUpdatingContact(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setUpdatingPassword(true);
      const res = await api.put('/portal/change-password', {
        currentPassword,
        newPassword
      });
      if (res.success) {
        setPasswordSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        setPasswordError(res.message || 'Failed to change password.');
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password. Please verify current password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
          <User className="w-6 h-6 text-blue-600 mr-2" />
          Customer Profile &amp; Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Corporate organization registration, primary contact, and portal security.
        </p>
      </div>

      {/* 1. Legal Demographics Card (Read-Only) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Corporate Registration (Official Record)</h2>
          </div>
          <span className="text-[11px] font-bold text-slate-400">Locked for Legal Audits</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Company Name</span>
            <span className="font-bold text-slate-900">{profile?.companyName}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Customer Code</span>
            <span className="font-mono font-bold text-blue-700">{profile?.clientCode}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">GSTIN Registration</span>
            <span className="font-mono font-bold text-slate-900">{profile?.gstNumber || 'Unregistered'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Customer Classification</span>
            <span className="font-bold text-slate-900">{profile?.customerType || 'Industrial Client'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Registered Portal Email</span>
            <span className="font-mono font-bold text-slate-900 truncate block">{profile?.email}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Location</span>
            <span className="font-bold text-slate-900">{profile?.clientLocation || 'Tamil Nadu'}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 italic">
          * Note: Corporate entity name and GSTIN modifications require official verification by Sky Power commercial operations.
        </p>
      </div>

      {/* 2. Editable Contact Details */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Designated Contact Information</h2>
          <p className="text-xs text-slate-500">Update officer name, mobile phone, and contact channels.</p>
        </div>

        {contactSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{contactSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUpdateContact} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Contact Person *</label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile Phone (10 digits) *</label>
              <input
                type="text"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Office Telephone</label>
              <input
                type="text"
                value={officePhone}
                onChange={(e) => setOfficePhone(e.target.value)}
                placeholder="Landline / Extension"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updatingContact}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              {updatingContact ? 'Saving...' : 'Save Contact Details'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Security & Password Change */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">Change Portal Password</h2>
          </div>
          <p className="text-xs text-slate-500">Ensure your account is protected with a strong password.</p>
        </div>

        {passwordError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs max-w-md">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">New Password (min 6 characters) *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updatingPassword}
              className="px-5 py-2.5 bg-[#062B59] hover:bg-blue-900 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
