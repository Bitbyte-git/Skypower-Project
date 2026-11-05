import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { Users, Search, Plus, Building2, MapPin, ArrowRight } from 'lucide-react';

export const ClientsList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [settings, setSettings] = useState(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients', {
        params: { search, customerType }
      });
      if (res.success) {
        setClients(res.clients || []);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.success) setSettings(res.settings);
      } catch (e) {}
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchClients();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, customerType]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E3A5F] tracking-tight">Clients Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">Corporate accounts &amp; customer entities</p>
        </div>
        <Link
          to="/clients/new"
          className="inline-flex items-center px-3.5 py-2 btn-primary text-white text-xs font-bold rounded-lg shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Register Client
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name, location, contact..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E5BB8]/15 focus:border-[#1E5BB8] outline-none transition-all"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-[#1E5BB8]/15 focus:border-[#1E5BB8] outline-none transition-all"
          >
            <option value="">All Customer Types</option>
            {(settings?.customerTypes || []).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clients Table with Smooth Row Hover */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-wider">
                <th className="py-3.5 px-4">Company Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">GSTIN</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#1E5BB8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading client records...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No client records found.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr
                    key={client._id}
                    className="hover:bg-[#F0F5FD]/60 transition-colors duration-150 group"
                  >
                    <td className="py-3 px-4">
                      <Link
                        to={`/clients/${client._id}`}
                        className="font-bold text-[#1E5BB8] hover:underline flex items-center space-x-1.5"
                      >
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-[#1E5BB8] transition-colors" />
                        <span>{client.companyName}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-medium">
                        {client.customerType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{client.contactPerson}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{client.mobile}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{client.clientLocation}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {client.gstNumber || '-'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/clients/${client._id}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold text-[#1E5BB8] hover:bg-[#F0F5FD] transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        to={`/enquiries/new?clientId=${client._id}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold text-[#EE6F2D] hover:bg-[#FFF5EE] transition-colors"
                      >
                        + Enquiry
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
