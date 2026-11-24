import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  ArrowLeft,
  Plus,
  FileSpreadsheet,
  ShieldCheck,
  Key,
  ExternalLink,
  UserCheck,
  AlertCircle,
  Lock,
  Copy,
  Check,
  Power,
  MessageSquare,
  Send
} from 'lucide-react';

export const ClientProfile = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Customer Portal State
  const [portalLoading, setPortalLoading] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [inviteMode, setInviteMode] = useState('activation_link'); // 'activation_link' | 'custom_password'
  const [portalEmail, setPortalEmail] = useState('');
  const [portalPassword, setPortalPassword] = useState('SkyPower@2026');
  const [portalCredentials, setPortalCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchClient = async () => {
    try {
      const res = await api.get(`/clients/${id}`);
      if (res.success) {
        setClient(res.client);
        setEnquiries(res.enquiries || []);
        setPortalEmail(res.client.portalAccess?.portalEmail || res.client.email || '');
      }
    } catch (err) {
      console.error('Failed to load client:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const handleEnablePortal = async (e) => {
    e.preventDefault();
    try {
      setPortalLoading(true);
      const res = await api.post(`/clients/${id}/portal-access`, {
        email: portalEmail,
        password: portalPassword
      });
      if (res.success) {
        setPortalCredentials(res.credentials);
        await fetchClient();
      } else {
        alert(res.message || 'Failed to enable portal.');
      }
    } catch (err) {
      alert('Error enabling customer portal: ' + err.message);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleTogglePortal = async () => {
    try {
      setPortalLoading(true);
      const res = await api.post(`/clients/${id}/portal-access/toggle`);
      if (res.success) {
        await fetchClient();
      }
    } catch (err) {
      alert('Error toggling portal: ' + err.message);
    } finally {
      setPortalLoading(false);
    }
  };

  const copyCredentials = () => {
    const activationLink = portalCredentials?.activationUrl
      ? `${window.location.origin}${portalCredentials.activationUrl}`
      : `${window.location.origin}/customer/login`;
    const text = inviteMode === 'activation_link'
      ? `*Sky Power Switchgears - Customer Portal Activation Link*\n\nDear ${client?.contactPerson || client?.companyName},\n\nPlease click the activation link below to set your password and activate your Customer Portal:\n${activationLink}\n\nRegistered Email: ${portalCredentials?.email || client?.portalAccess?.portalEmail}`
      : `*Sky Power Switchgears - Customer Portal Login Details*\n\nPortal URL: ${window.location.origin}/customer/login\nEmail: ${portalCredentials?.email || client?.portalAccess?.portalEmail}\nInitial Password: ${portalCredentials?.initialPassword || 'SkyPower@2026'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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

      {/* Customer Portal Access & Activation Management */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold tracking-tight">Customer Portal Access</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                client.portalAccess?.enabled && client.portalAccess?.status === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {client.portalAccess?.enabled && client.portalAccess?.status === 'ACTIVE' ? 'Active' : 'Not Activated'}
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Enable your client to securely log into the Sky Power Customer Portal to track switchgear manufacturing progress, inspect approved GA/SLD drawings, review invoices, and download routine test reports.
            </p>
            {client.portalAccess?.enabled && (
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 text-[11px] block">Login Username / Email:</span>
                  <span className="font-mono font-bold text-sky-300">{client.portalAccess.portalEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Portal URL:</span>
                  <a
                    href="/customer/login"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sky-400 underline inline-flex items-center"
                  >
                    /customer/login <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!client.portalAccess?.enabled ? (
              <button
                type="button"
                onClick={() => {
                  setPortalCredentials(null);
                  setShowPortalModal(true);
                }}
                className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Enable Customer Portal</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setPortalCredentials(null);
                    setShowPortalModal(true);
                  }}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Reset / Change Password</span>
                </button>
                <button
                  type="button"
                  onClick={handleTogglePortal}
                  disabled={portalLoading}
                  className={`px-3.5 py-2 font-semibold text-xs rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer ${
                    client.portalAccess.status === 'ACTIVE'
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{client.portalAccess.status === 'ACTIVE' ? 'Suspend Portal' : 'Re-activate'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enable / Reset Portal Modal */}
      {showPortalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">
                  {client.portalAccess?.enabled ? 'Manage Portal Credentials' : 'Provision Customer Portal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPortalModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {portalCredentials ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Customer Portal Ready!</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Share with <strong>{client.companyName}</strong> via WhatsApp, Email, or Copy:
                    </p>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100 font-mono text-xs space-y-2 text-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Client Email:</span>
                        <span className="font-semibold">{portalCredentials.email}</span>
                      </div>
                      {inviteMode === 'activation_link' ? (
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Client Activation Link (Client sets their password):</span>
                          <span className="text-sky-700 break-all select-all font-semibold">
                            {window.location.origin}{portalCredentials.activationUrl}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Initial Password:</span>
                          <span className="font-semibold text-emerald-700">{portalCredentials.initialPassword}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center space-x-2">
                      <a
                        href={`https://api.whatsapp.com/send?phone=${(client.mobile || '').replace(/[^0-9]/g, '')}&text=${encodeURIComponent(
                          inviteMode === 'activation_link'
                            ? `*Sky Power Switchgears - Customer Portal Access*\n\nDear ${client.contactPerson || client.companyName},\n\nYour Sky Power Customer Portal has been enabled. Please click the link below to set your password and access your dashboard:\n\n🔗 *Set Your Password:* ${window.location.origin}${portalCredentials.activationUrl}\n📧 Login Email: ${portalCredentials.email}\n\nYou will be able to track switchgear manufacturing progress, inspect approved drawings, and view payment receipts.\n\nThank you,\nSky Power Switchgears Pvt Ltd`
                            : `*Sky Power Switchgears - Customer Portal Access*\n\nDear ${client.contactPerson || client.companyName},\n\nYour Sky Power Customer Portal account is active.\n\n🌐 Portal Link: ${window.location.origin}/customer/login\n📧 Login Email: ${portalCredentials.email}\n🔑 Temporary Password: ${portalCredentials.initialPassword}\n\n*Note:* Please change your password after logging in from the Profile section.\n\nThank you,\nSky Power Switchgears Pvt Ltd`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send via WhatsApp</span>
                      </a>
                      <a
                        href={`mailto:${portalCredentials.email}?subject=${encodeURIComponent(
                          inviteMode === 'activation_link' ? 'Activate Your Sky Power Customer Portal' : 'Your Sky Power Customer Portal Credentials'
                        )}&body=${encodeURIComponent(
                          inviteMode === 'activation_link'
                            ? `Dear ${client.contactPerson || client.companyName},\n\nYour Sky Power Customer Portal account has been created.\n\nPlease click the activation link below to choose your password and activate your access:\n\n${window.location.origin}${portalCredentials.activationUrl}\n\nLogin Email: ${portalCredentials.email}\n\nBest regards,\nSky Power Switchgears Pvt Ltd`
                            : `Dear ${client.contactPerson || client.companyName},\n\nYour Sky Power Customer Portal account has been activated.\n\nPortal Login URL: ${window.location.origin}/customer/login\nUsername: ${portalCredentials.email}\nInitial Password: ${portalCredentials.initialPassword}\n\nWe recommend changing your password upon first login in your Profile section.\n\nBest regards,\nSky Power Switchgears Pvt Ltd`
                        )}`}
                        className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send via Email</span>
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={copyCredentials}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied Link!' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPortalModal(false)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEnablePortal} className="space-y-4">
                  {/* Mode Selector */}
                  <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setInviteMode('activation_link')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        inviteMode === 'activation_link'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Client Sets Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteMode('custom_password')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        inviteMode === 'custom_password'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Admin Sets Password
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Customer Login Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={portalEmail}
                      onChange={(e) => setPortalEmail(e.target.value)}
                      placeholder="e.g. contact@clientcompany.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      The customer will use this email address to log into their portal.
                    </span>
                  </div>

                  {inviteMode === 'activation_link' ? (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
                      <div className="font-bold flex items-center space-x-1.5 text-blue-800">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>No Password Needed from Admin</span>
                      </div>
                      <p className="text-[11px] text-blue-700 leading-relaxed">
                        A secure activation link will be generated. The client will open this link on their device, enter their own secret password, and immediately log in.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Initial Password *
                      </label>
                      <input
                        type="text"
                        required
                        value={portalPassword}
                        onChange={(e) => setPortalPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        You can share this initial password with the client. They can change it in their portal profile.
                      </span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPortalModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={portalLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      {portalLoading ? 'Setting up...' : inviteMode === 'activation_link' ? 'Generate Activation Link' : 'Activate with Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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

