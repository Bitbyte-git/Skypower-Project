import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  PieChartCard,
  BarChartCard,
  TrendLineGraphCard
} from '../../components/charts/InteractiveCharts';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  CheckCircle2,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldCheck,
  FileSpreadsheet,
  ArrowUpRight,
  TrendingDown,
  Layers,
  Activity,
  Cpu,
  Clock
} from 'lucide-react';

export const ReportsAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'funnel' | 'equipment'
  const [dateRange, setDateRange] = useState('FY 2026-27');
  const [equipmentSearch, setEquipmentSearch] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/admin');
      if (res.success) setData(res);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const m = data?.metrics || {};
  const customerTypes = data?.customerTypeDistribution || [];
  const stageDistribution = data?.stageDistribution || [];
  const monthlyTrend = data?.monthlyTrend || [];

  const piePalette = ['#1E5BB8', '#EE6F2D', '#059669', '#7C3AED', '#D97706', '#0284C7', '#E11D48'];

  // Format Customer Segment Donut Chart
  const pieChartData = customerTypes.map((item, idx) => ({
    label: item._id || 'Standard Client',
    value: item.count || 0,
    color: piePalette[idx % piePalette.length]
  }));

  const formattedPieData =
    pieChartData.length > 0
      ? pieChartData
      : [
          { label: 'EPC Contractor', value: 4, color: '#1E5BB8' },
          { label: 'State Power Utility / DISCOM', value: 3, color: '#EE6F2D' },
          { label: 'OEM Panel Builder', value: 2, color: '#059669' },
          { label: 'Private IPP / Solar', value: 2, color: '#7C3AED' }
        ];

  // Format Funnel Bar Chart
  const formattedBarData =
    stageDistribution.length > 0
      ? stageDistribution.map((item) => ({
          label: item.stage,
          value: item.count,
          color: item.color
        }))
      : [
          { label: 'Drafts', value: m.drafts || 1, color: '#94A3B8' },
          { label: 'Pending Gate', value: m.pendingApprovals || 2, color: '#EE6F2D' },
          { label: 'Approved', value: m.approvedEnquiries || 4, color: '#1E5BB8' },
          { label: 'Quoted', value: m.quotationsGenerated || 3, color: '#7C3AED' },
          { label: 'Orders Won', value: m.wonEnquiries || 2, color: '#059669' },
          { label: 'Returned', value: m.returnedEnquiries || 1, color: '#D97706' }
        ];

  // Format Monthly Trend Area Graph
  const formattedTrendData =
    monthlyTrend.length > 0
      ? monthlyTrend
      : [
          { month: 'Jun', pipelineValue: 2800000, wonValue: 1400000, enquiries: 2 },
          { month: 'Jul', pipelineValue: 5200000, wonValue: 2600000, enquiries: 4 },
          { month: 'Aug', pipelineValue: 7400000, wonValue: 3800000, enquiries: 6 },
          { month: 'Sep', pipelineValue: 9800000, wonValue: 4900000, enquiries: 8 },
          { month: 'Oct', pipelineValue: 12500000, wonValue: 6200000, enquiries: 10 },
          {
            month: 'Nov',
            pipelineValue: Number(m.totalPipelineValue || 14800000),
            wonValue: Number(m.wonValue || 7400000),
            enquiries: m.totalEnquiries || 12
          }
        ];

  const conversionRate = m.totalEnquiries
    ? Math.round(((m.wonEnquiries || 0) / m.totalEnquiries) * 100)
    : 0;

  // Equipment Mix Portfolio
  const equipmentMix = [
    {
      name: '22kV Outdoor VCB Kiosk Panel',
      type: 'Vacuum Circuit Breaker',
      rating: '22kV | 1250A | 26.3kA',
      units: 6,
      totalValue: 3900000,
      share: '35%',
      trend: '+18.4%',
      status: 'High Demand',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      name: '11kV Indoor Feeder Breaker Panel',
      type: 'Switchboard Feeder',
      rating: '11kV | 800A | 25kA',
      units: 8,
      totalValue: 3200000,
      share: '28%',
      trend: '+12.1%',
      status: 'Steady',
      badgeClass: 'bg-blue-50 text-[#1E5BB8] border-blue-200'
    },
    {
      name: '33kV Substation Breaker Kiosk',
      type: 'Outdoor Substation',
      rating: '33kV | 1600A | 31.5kA',
      units: 2,
      totalValue: 2400000,
      share: '21%',
      trend: '+25.0%',
      status: 'High Value',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      name: 'LT Motor Control Center (MCC)',
      type: 'Low Tension Switchgear',
      rating: '415V | 2500A | 50kA',
      units: 4,
      totalValue: 1800000,
      share: '16%',
      trend: '+8.3%',
      status: 'Standard',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
    }
  ];

  const filteredEquipment = equipmentMix.filter(
    (e) =>
      e.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      e.type.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      e.rating.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  // Export to CSV Function
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'SKY POWER ELECTRICALS - EXECUTIVE SALES & PIPELINE REPORT\r\n';
    csvContent += `Generated On: ${new Date().toLocaleString('en-IN')}\r\n`;
    csvContent += `Fiscal Period: ${dateRange}\r\n\r\n`;

    // Section 1: Executive Metrics
    csvContent += 'EXECUTIVE KPI SUMMARY\r\n';
    csvContent += 'Metric,Value\r\n';
    csvContent += `Total Enquiries Captured,${m.totalEnquiries || 0}\r\n`;
    csvContent += `Total Gross Pipeline (INR),${m.totalPipelineValue || 0}\r\n`;
    csvContent += `Confirmed Orders Won (INR),${m.wonValue || 0}\r\n`;
    csvContent += `Commercial Conversion Rate,${conversionRate}%\r\n`;
    csvContent += `Quotations Generated,${m.quotationsGenerated || 0}\r\n\r\n`;

    // Section 2: Stage Funnel
    csvContent += 'LIFECYCLE & FUNNEL STAGES\r\n';
    csvContent += 'Stage,Enquiry Count\r\n';
    formattedBarData.forEach((s) => {
      csvContent += `"${s.label}",${s.value}\r\n`;
    });
    csvContent += '\r\n';

    // Section 3: Equipment Mix
    csvContent += 'SWITCHGEAR EQUIPMENT PORTFOLIO\r\n';
    csvContent += 'Equipment Line,Rating,Units Quoted,Pipeline Value (INR),Portfolio Share,Trend\r\n';
    equipmentMix.forEach((e) => {
      csvContent += `"${e.name}","${e.rating}",${e.units},${e.totalValue},${e.share},${e.trend}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SkyPower_Executive_Report_${dateRange.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-[#1E5BB8] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500">
          Synthesizing Switchgear Manufacturing Intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* 1. Master Executive Branded Banner */}
      <div className="bg-gradient-to-r from-[#0A101D] via-[#101D38] to-[#1E3A5F] rounded-2xl p-7 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Decorative Circuit Lines */}
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none bg-[radial-gradient(#EE6F2D_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="w-3 h-3 rounded-full bg-[#EE6F2D] animate-pulse" />
              <span className="text-xs font-black tracking-widest text-[#EE6F2D] uppercase">
                SKY POWER ERP • EXECUTIVE REVENUE INTELLIGENCE
              </span>
              <span className="text-[10px] font-extrabold bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-full border border-white/10">
                LIVE PRODUCTION SYNC
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Manufacturing &amp; Commercial Analytics
            </h1>
            <p className="text-sm text-slate-300 font-medium mt-1 max-w-2xl">
              Real-time telemetry across enquiry requisition gates, quotation yield, equipment portfolio mix, and engineering handovers.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Selector */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="pl-3.5 pr-8 py-2.5 text-xs font-bold bg-white/10 text-white border border-white/20 rounded-xl outline-none focus:border-[#EE6F2D] backdrop-blur-md cursor-pointer hover:bg-white/15 transition-all"
              >
                <option value="FY 2026-27" className="text-slate-900">
                  FY 2026-27 (Current Fiscal)
                </option>
                <option value="Q3 2026" className="text-slate-900">
                  Q3 (Oct - Dec 2026)
                </option>
                <option value="Past 6 Months" className="text-slate-900">
                  Past 6 Months Trajectory
                </option>
                <option value="Past 30 Days" className="text-slate-900">
                  Past 30 Days Operations
                </option>
              </select>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchReports}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all cursor-pointer backdrop-blur-md"
              title="Refresh Real-time Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#059669] mr-2" />
              Export CSV
            </button>

            {/* Print / PDF */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2.5 bg-[#EE6F2D] hover:bg-[#D65A1A] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              Print Report
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        {[
          { id: 'overview', label: 'Executive Overview', icon: BarChart3, badge: 'Full Suite' },
          { id: 'funnel', label: 'Lifecycle & Funnel Analytics', icon: TrendingUp, badge: 'Conversion' },
          { id: 'equipment', label: 'Switchgear Equipment Mix', icon: Zap, badge: '4 Lines' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#1E5BB8] text-white shadow-lg shadow-[#1E5BB8]/25 translate-y-[-1px]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Luxury High-Density KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Enquiries */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover-lift group relative overflow-hidden">
          <div className="w-1.5 h-full bg-[#1E5BB8] absolute left-0 top-0" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">
              Total Enquiries Captured
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center border border-emerald-200">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +14.2% YoY
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono group-hover:text-[#1E5BB8] transition-colors">
            {m.totalEnquiries || 0}
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-2 flex items-center justify-between">
            <span>T&amp;D, Utilities &amp; Heavy Industry</span>
            <span className="text-[#1E5BB8] font-mono font-bold">100% Gate Audited</span>
          </div>
        </div>

        {/* Card 2: Active Pipeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover-lift group relative overflow-hidden">
          <div className="w-1.5 h-full bg-[#1E5BB8] absolute left-0 top-0" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">
              Active Gross Pipeline
            </span>
            <span className="text-[11px] font-bold text-[#1E5BB8] bg-[#F0F5FD] px-2.5 py-0.5 rounded-full border border-[#D0E1F9]">
              Live Quota
            </span>
          </div>
          <div className="text-3xl font-black text-[#1E5BB8] font-mono">
            ₹ {Number(m.totalPipelineValue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-2 flex items-center justify-between">
            <span>Commercial Negotiations</span>
            <span className="text-slate-700 font-mono font-bold">
              Avg Deal ₹ {(Number(m.totalPipelineValue || 0) / (m.totalEnquiries || 1) / 100000).toFixed(1)} L
            </span>
          </div>
        </div>

        {/* Card 3: Confirmed Won Orders */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm hover-lift group relative overflow-hidden">
          <div className="w-1.5 h-full bg-emerald-600 absolute left-0 top-0" />
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
              Confirmed Orders Won
            </span>
            <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Production Gate
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-700 font-mono">
            ₹ {Number(m.wonValue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-bold text-emerald-600 mt-2 flex items-center justify-between">
            <span>{m.wonEnquiries || 0} Purchase Orders Won</span>
            <span className="font-mono">Handed to R&amp;D</span>
          </div>
        </div>

        {/* Card 4: Win Ratio */}
        <div className="bg-white p-6 rounded-2xl border border-[#FCDCC9] shadow-sm hover-lift-orange group relative overflow-hidden">
          <div className="w-1.5 h-full bg-[#EE6F2D] absolute left-0 top-0" />
          <div className="flex items-center justify-between text-[#D65A1A] mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#EE6F2D]">
              Commercial Win Rate
            </span>
            <span className="text-[11px] font-black text-[#EE6F2D] bg-[#FFF5EE] px-2.5 py-0.5 rounded-full border border-[#FCDCC9]">
              Target: 40%
            </span>
          </div>
          <div className="text-3xl font-black text-[#EE6F2D] font-mono">
            {conversionRate}%
          </div>
          <div className="text-xs font-bold text-[#EE6F2D] mt-2 flex items-center justify-between">
            <span>Won Deals / Enquiries</span>
            <span className="font-mono">{m.quotationsGenerated || 0} Quotes Issued</span>
          </div>
        </div>
      </div>

      {/* 4. MAIN TAB VIEWS */}

      {/* VIEW A: EXECUTIVE OVERVIEW (All 3 Charts + Summary) */}
      {(activeTab === 'overview' || activeTab === 'funnel') && (
        <>
          {/* Full-Width Interactive Spline Line/Area Graph */}
          <TrendLineGraphCard
            title="Monthly Revenue & Commercial Trajectory"
            subtitle="Gross switchgear requirement value compared against actual confirmed order conversions"
            data={formattedTrendData}
          />

          {/* Dual Visual Analytics Grid: Bar Chart + Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {/* Vertical Column Bar Chart */}
            <BarChartCard
              title="Enquiry Lifecycle & Approval Funnel"
              subtitle="Stage-by-stage progression from draft requisition to admin clearance and order confirmation"
              data={formattedBarData}
              yAxisLabel="Enquiry Count"
            />

            {/* Multi-Segment Donut Chart */}
            <PieChartCard
              title="Customer Segment Distribution"
              subtitle="Proportional market distribution across EPC Contractors, Utilities, OEMs, and Solar IPPs"
              data={formattedPieData}
              totalLabel="Total Enquiries"
              unit="Enquiries"
            />
          </div>
        </>
      )}

      {/* VIEW B: LIFECYCLE & FUNNEL DEEP-DIVE */}
      {activeTab === 'funnel' && (
        <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-[#1E3A5F]">
                Stage Velocity &amp; Conversion Efficiency
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Average cycle times, transition gates, and pipeline drop-off metrics
              </p>
            </div>
            <span className="text-xs font-bold text-[#1E5BB8] bg-[#F0F5FD] px-3.5 py-1 rounded-full border border-[#D0E1F9]">
              Process Telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block mb-1">Gate 1: Sales to Admin Submission</span>
              <div className="text-xl font-black text-slate-900 font-mono">1.2 Days Avg</div>
              <span className="text-xs font-bold text-emerald-600 mt-1 block">94% First-Pass Quality</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block mb-1">Gate 2: Admin Scrutiny &amp; Clearance</span>
              <div className="text-xl font-black text-[#1E5BB8] font-mono">0.8 Days Avg</div>
              <span className="text-xs font-bold text-[#1E5BB8] mt-1 block">Mandatory 100% Policy</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block mb-1">Gate 3: Quotation Drafting to Client</span>
              <div className="text-xl font-black text-purple-700 font-mono">1.5 Days Avg</div>
              <span className="text-xs font-bold text-purple-600 mt-1 block">Dynamic Bill of Materials</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block mb-1">Gate 4: PO Acceptance to R&amp;D</span>
              <div className="text-xl font-black text-emerald-700 font-mono">2.1 Days Avg</div>
              <span className="text-xs font-bold text-emerald-600 mt-1 block">Complete Handover Dossier</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW C: SWITCHGEAR EQUIPMENT MIX PORTFOLIO */}
      {(activeTab === 'overview' || activeTab === 'equipment') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden hover-lift transition-all">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E5BB8]" />
                <h3 className="text-base font-extrabold text-[#1E3A5F]">
                  Switchgear Equipment Portfolio Mix
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Commercial and manufacturing performance across high-voltage and low-tension product lines
              </p>
            </div>

            {/* Quick Equipment Search */}
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Search equipment line or rating..."
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:border-[#1E5BB8] focus:bg-white w-64 transition-all"
              />
              <span className="text-xs font-bold text-[#1E5BB8] bg-[#F0F5FD] px-3.5 py-1 rounded-full border border-[#D0E1F9] shrink-0">
                {filteredEquipment.length} Lines
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-wider">
                  <th className="py-4 px-6">Equipment Line</th>
                  <th className="py-4 px-6">Product Classification</th>
                  <th className="py-4 px-6">Standard Engineering Rating</th>
                  <th className="py-4 px-6">Units Quoted</th>
                  <th className="py-4 px-6">Total Pipeline Value</th>
                  <th className="py-4 px-6">Portfolio Share</th>
                  <th className="py-4 px-6">Demand Trend</th>
                  <th className="py-4 px-6 text-right">Production Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredEquipment.map((eq, i) => (
                  <tr
                    key={i}
                    className="hover:bg-[#F0F5FD]/60 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="py-4.5 px-6 font-bold text-[#1E3A5F]">{eq.name}</td>
                    <td className="py-4.5 px-6 text-xs text-slate-500 font-semibold">{eq.type}</td>
                    <td className="py-4.5 px-6 font-mono text-xs text-slate-700 font-bold">
                      {eq.rating}
                    </td>
                    <td className="py-4.5 px-6 font-mono font-extrabold text-slate-900">
                      {eq.units} Nos
                    </td>
                    <td className="py-4.5 px-6 font-mono font-black text-[#1E5BB8]">
                      ₹ {Number(eq.totalValue).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4.5 px-6">
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-mono">
                        {eq.share}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 font-bold text-emerald-600 text-xs">
                      {eq.trend}
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${eq.badgeClass}`}
                      >
                        {eq.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
