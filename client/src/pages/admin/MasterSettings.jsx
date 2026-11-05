import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Settings, Save, Plus, Trash2, CheckCircle2, Building2 } from 'lucide-react';

export const MasterSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Local additions
  const [newCustomerType, setNewCustomerType] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newVoltage, setNewVoltage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.success) setSettings(res.settings);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      await api.put('/settings', settings);
      setSuccess('System configuration updated successfully.');
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const addArrayItem = (field, value, clearFn) => {
    if (!value.trim()) return;
    if (settings[field]?.includes(value.trim())) return;
    setSettings({
      ...settings,
      [field]: [...(settings[field] || []), value.trim()]
    });
    clearFn('');
  };

  const removeArrayItem = (field, index) => {
    const updated = settings[field].filter((_, i) => i !== index);
    setSettings({ ...settings, [field]: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master System Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin governance: Configure dynamic customer classifications, switchgear ratings, and company header profile.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Profile */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Company Header Information (Rendered on Quotation PDFs)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Legal Entity</label>
              <input
                type="text"
                value={settings?.companyProfile?.name || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    companyProfile: { ...settings.companyProfile, name: e.target.value }
                  })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate GSTIN</label>
              <input
                type="text"
                value={settings?.companyProfile?.gstin || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    companyProfile: { ...settings.companyProfile, gstin: e.target.value }
                  })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Manufacturing Works & Registered Address</label>
              <input
                type="text"
                value={settings?.companyProfile?.address || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    companyProfile: { ...settings.companyProfile, address: e.target.value }
                  })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sales Official Email</label>
              <input
                type="email"
                value={settings?.companyProfile?.email || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    companyProfile: { ...settings.companyProfile, email: e.target.value }
                  })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Commercial Hotline / Tel</label>
              <input
                type="text"
                value={settings?.companyProfile?.phone || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    companyProfile: { ...settings.companyProfile, phone: e.target.value }
                  })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Customer Types Config */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Customer Types (Dynamic Dropdown)
          </h2>
          <div className="flex flex-wrap gap-2">
            {(settings?.customerTypes || []).map((type, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
              >
                {type}
                <button
                  type="button"
                  onClick={() => removeArrayItem('customerTypes', idx)}
                  className="ml-2 text-rose-500 hover:text-rose-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              value={newCustomerType}
              onChange={(e) => setNewCustomerType(e.target.value)}
              placeholder="Add new customer type (e.g. Metro Rail Authority)..."
              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded"
            />
            <button
              type="button"
              onClick={() => addArrayItem('customerTypes', newCustomerType, setNewCustomerType)}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-bold"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Voltage Ratings */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Standard Switchgear Voltage Ratings
          </h2>
          <div className="flex flex-wrap gap-2">
            {(settings?.voltageRatings || []).map((v, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded bg-blue-50 text-blue-900 text-xs font-semibold border border-blue-200"
              >
                {v}
                <button
                  type="button"
                  onClick={() => removeArrayItem('voltageRatings', idx)}
                  className="ml-2 text-rose-500 hover:text-rose-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              value={newVoltage}
              onChange={(e) => setNewVoltage(e.target.value)}
              placeholder="e.g. 132 kV..."
              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded"
            />
            <button
              type="button"
              onClick={() => addArrayItem('voltageRatings', newVoltage, setNewVoltage)}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-bold"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-5 py-2.5 bg-[#1D4ED8] hover:bg-blue-800 text-white rounded text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? 'Updating Configuration...' : 'Save System Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

