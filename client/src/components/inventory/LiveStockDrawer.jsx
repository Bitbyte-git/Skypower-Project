import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Boxes,
  Search,
  X,
  PackagePlus,
  PackageMinus,
  ExternalLink,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const LiveStockDrawer = ({ isOpen, onClose, activeProjectTrackingId = null }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    if (isOpen) {
      loadStock();
    }
  }, [isOpen, selectedCategory]);

  const loadStock = async () => {
    setLoading(true);
    try {
      const q = selectedCategory !== 'ALL' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
      const res = await api.get(`/inventory/items${q}`);
      setItems(res.items || []);
    } catch (e) {
      console.warn('Failed to load stock in drawer:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = items.filter((it) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      it.itemCode?.toLowerCase().includes(s) ||
      it.itemName?.toLowerCase().includes(s) ||
      it.specification?.toLowerCase().includes(s) ||
      it.brand?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-[#062B59] to-[#0878C9] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-teal-300" />
            <div>
              <h3 className="text-sm font-bold">Stores & Live Stock Readiness</h3>
              <p className="text-[11px] text-blue-100">
                {activeProjectTrackingId ? `For Project: ${activeProjectTrackingId}` : 'Warehouse Inventory Master'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search CT, PT, Relay, Breaker, Busbar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-lg border bg-white focus:outline-none"
              style={{ borderColor: '#CBD5E1' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              Showing {filtered.length} components
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/inventory');
              }}
              className="text-[11px] font-bold text-[#0878C9] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Full Stock Admin Portal</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-xs font-bold">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0878C9]" />
              Fetching Live Inventory...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-semibold">
              No components found matching "{search}".
            </div>
          ) : (
            filtered.map((it) => {
              const isLow = (it.currentStock || 0) <= (it.minReorderLevel || 5);
              const isZero = (it.currentStock || 0) <= 0;

              return (
                <div
                  key={it._id}
                  className="p-3 rounded-xl border bg-white hover:border-slate-300 transition-all shadow-2xs flex flex-col space-y-1.5"
                  style={{ borderColor: isZero ? '#FECDD3' : isLow ? '#FEF08A' : '#E2E8F0' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {it.itemCode}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{it.itemName}</h4>
                    </div>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        isZero
                          ? 'bg-rose-100 text-rose-700'
                          : isLow
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {it.currentStock} {it.uom}
                    </span>
                  </div>

                  {it.specification && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">{it.specification}</p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{it.rackLocation || 'Bay 1'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/inventory?project=${activeProjectTrackingId || ''}`);
                      }}
                      className="font-bold text-[11px] text-[#0878C9] hover:text-[#062B59] flex items-center space-x-0.5 cursor-pointer"
                    >
                      <span>Issue / Inward</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-slate-50 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={loadStock}
            className="text-slate-600 hover:text-slate-900 font-bold flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/inventory');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#0878C9] hover:bg-[#062B59] text-white font-bold cursor-pointer"
          >
            Open Stock Admin
          </button>
        </div>
      </div>
    </div>
  );
};
