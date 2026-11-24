import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  FileCheck2,
  Download,
  Search,
  Filter,
  FileText,
  Calendar,
  Layers,
  ShieldCheck,
  Package
} from 'lucide-react';

export const CustomerDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/portal/documents');
        if (res.success) {
          setDocuments(res.documents || []);
        }
      } catch (err) {
        console.error('Failed to fetch customer documents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.documentName?.toLowerCase().includes(search.toLowerCase()) ||
      doc.documentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      doc.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      doc.projectTitle?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (categoryFilter === 'ALL') return true;
    return doc.category === categoryFilter;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <FileCheck2 className="w-6 h-6 text-purple-600 mr-2" />
              Drawings &amp; Technical Documents
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Official customer-permitted engineering submittals, single line diagrams, and test certificates.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Available: <strong className="text-slate-900">{filteredDocs.length} Document(s)</strong>
          </span>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by drawing title, number, or order..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            {[
              { key: 'ALL', label: 'All Files' },
              { key: 'DRAWING', label: 'Drawings' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategoryFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === tab.key
                    ? 'bg-[#062B59] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Document Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading document archive...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-16 text-center space-y-3">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Documents Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Drawings and inspection reports will be posted here once they have passed internal review and are released for customer submission.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700">{doc.documentNumber}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                    {doc.revision}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                  {doc.documentName}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Order: <strong className="text-slate-700">{doc.orderNumber}</strong> ({doc.projectTitle})
                </p>

                <div className="flex items-center space-x-2 pt-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    {doc.status}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(doc.uploadedDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                {doc.fileUrl ? (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Technical Document</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full py-2 px-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-medium cursor-not-allowed text-center"
                  >
                    Drafting by Design Team
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
