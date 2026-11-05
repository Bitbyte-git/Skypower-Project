import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Building2, Phone, Mail, Globe, MapPin, ArrowLeft, Plus, FileSpreadsheet } from 'lucide-react';

export const ClientProfile = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await api.get(`/clients/${id}`);
        if (res.success) {
          setClient(res.client);
          setEnquiries(res.enquiries || []);
        }
      } catch (err) {
        console.error('Failed to load client:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Client profile not found.</p>
        <Link to="/clients" className="text-xs text-blue-600 underline mt-2 inline-block">
          Return to Clients Master
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <Link to="/clients" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{client.companyName}</h1>
            <p className="text-xs text-slate-500">Registered Client ID: {client._id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to={`/clients/${client._id}/edit`}
            className="px-3 py-1.5 border border-slate-300 text-xs font-semibold rounded bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            Edit Record
          </Link>
          <Link
            to={`/enquiries/new?clientId=${client._id}`}
            className="inline-flex items-center px-3.5 py-1.5 bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-bold rounded shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" /> Create Enquiry
          </Link>
        </div>
      </div>

      {/* Info Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Core Info */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Company Demographics
          </h2>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Customer Type</span>
            <p className="text-xs font-bold text-slate-800">{client.customerType}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Location</span>
            <p className="text-xs text-slate-800">{client.clientLocation}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">GSTIN Registration</span>
            <p className="text-xs font-mono font-bold text-slate-900">{client.gstNumber || 'Not Registered'}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Registered By</span>
            <p className="text-xs text-slate-800">{client.createdBy?.name || 'Sales Team'}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Primary Contact Person
          </h2>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Designated Officer</span>
            <p className="text-xs font-bold text-slate-800">{client.contactPerson}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Mobile Number</span>
            <p className="text-xs font-mono font-bold text-blue-700">{client.mobile}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Office Landline</span>
            <p className="text-xs text-slate-700">{client.officePhone || '-'}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Email Address</span>
            <p className="text-xs text-slate-700">{client.email || '-'}</p>
          </div>
        </div>

        {/* Address Info */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Billing & Plant Address
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            {client.billingAddress?.street || 'No street specified'}
            <br />
            {client.billingAddress?.city && `${client.billingAddress.city}, `}
            {client.billingAddress?.state && `${client.billingAddress.state} `}
            {client.billingAddress?.postalCode && `- ${client.billingAddress.postalCode}`}
            <br />
            {client.billingAddress?.country || 'India'}
          </p>
          {client.website && (
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Official Website</span>
              <p>
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline"
                >
                  {client.website}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Linked Enquiries History */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Enquiries Associated with this Client</h2>
            <p className="text-[11px] text-slate-500">Historical trail of switchgear requirements & offers.</p>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            {enquiries.length} Enquiries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">ERN</th>
                <th className="py-3 px-4">Offer Date</th>
                <th className="py-3 px-4">Enquiry Type</th>
                <th className="py-3 px-4">Est. Project Value</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">Commercial Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No enquiries initiated for this client yet.
                  </td>
                </tr>
              ) : (
                enquiries.map((enq) => (
                  <tr key={enq._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{enq.ern}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(enq.offerDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{enq.enquiryType}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ₹ {Number(enq.expectedProjectValue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={enq.approvalStatus} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={enq.commercialStatus} type="commercial" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/enquiries/${enq._id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        Inspect
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

