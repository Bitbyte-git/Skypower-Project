import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { FileText, Search, Download, ArrowRight } from 'lucide-react';

export const QuotationsList = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isAdmin } = useAuth();

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations', { params: { search } });
      if (res.success) {
        setQuotations(res.quotations || []);
      }
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchQuotations();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-[#1E3A5F] tracking-tight">Quotations Registry</h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F0F5FD] text-[#1E5BB8] border border-[#D0E1F9]">
              {quotations.length} Offers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Admin-approved commercial proposals and PDF contracts</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quotations by ref (e.g. QT-2026-0001) or ERN..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E5BB8]/15 focus:border-[#1E5BB8] outline-none transition-all"
          />
        </div>
      </div>

      {/* Table with Sleek Row Hover */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-wider">
                <th className="py-3.5 px-4">Quotation Ref</th>
                <th className="py-3.5 px-4">Ver</th>
                <th className="py-3.5 px-4">Linked ERN</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Valid Until</th>
                <th className="py-3.5 px-4">Final Value</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Offer &amp; PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#1E5BB8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching quotation records...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No quotations generated yet.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr
                    key={q._id}
                    className="hover:bg-[#F0F5FD]/60 transition-colors duration-150 group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#1E5BB8]">
                      <Link to={`/quotations/${q._id}`} className="hover:underline">
                        {q.formattedQuotationNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">v{q.version}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      <Link to={`/enquiries/${q.enquiryId?._id || q.enquiryId}`} className="hover:underline text-[#1E5BB8]">
                        {q.ern}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{q.clientId?.companyName || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(q.quotationDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(q.validityDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1E3A5F]">
                      ₹ {Number(q.finalQuotationValue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/quotations/${q._id}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold text-[#1E5BB8] hover:bg-[#F0F5FD] transition-colors"
                      >
                        Inspect
                      </Link>
                      {q.pdfDocumentPath && (
                        <a
                          href={q.pdfDocumentPath}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold text-[#EE6F2D] hover:bg-[#FFF5EE] transition-colors"
                          title="Download Commercial PDF"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          PDF
                        </a>
                      )}
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
