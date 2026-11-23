import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Boxes,
  Package,
  Plus,
  Upload,
  Download,
  Search,
  ChevronDown,
  List,
  LayoutGrid,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  XCircle,
  Layers,
  CheckCircle2,
  X,
  ExternalLink,
  MapPin,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

const CATEGORIES_LIST = [
  'All Categories',
  'Circuit Breaker',
  'Contactor',
  'MCCB',
  'Panel',
  'Cable',
  'CT & PT Coils',
  'Protection & Aux Relays',
  'Switchgear & VCB / ACB',
  'Copper & Aluminum Busbars'
];

export const InventoryManagement = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Stock Status');
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'GRID'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: '',
    category: 'Circuit Breaker',
    specification: '',
    brand: 'Schneider Electric',
    uom: 'Nos',
    currentStock: 100,
    minReorderLevel: 20,
    unitCost: 450,
    rackLocation: 'Bay 1 - Rack A1',
    imageUrl: '/products/mcb.svg',
    supplier: 'Schneider Electric India',
    notes: '',
    submitting: false,
    error: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const qParams = new URLSearchParams();
      if (selectedCategory !== 'All Categories') qParams.append('category', selectedCategory);
      if (selectedStatus !== 'All Stock Status') {
        const statusMap = {
          'In Stock': 'IN_STOCK',
          'Low Stock': 'LOW_STOCK',
          'Out of Stock': 'OUT_OF_STOCK'
        };
        qParams.append('status', statusMap[selectedStatus] || selectedStatus);
      }
      if (searchQuery.trim()) qParams.append('search', searchQuery.trim());

      const [itemsRes, statsRes] = await Promise.all([
        api.get(`/inventory/items?${qParams.toString()}`),
        api.get('/inventory/stats')
      ]);

      setItems(itemsRes.items || []);
      setStats(statsRes.stats || null);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      setError(err.message || 'Error communicating with inventory service.');
    } finally {
      setLoading(false);
    }
  };

  // Seed defaults if empty
  const handleSeedDefaults = async () => {
    try {
      setLoading(true);
      await api.post('/inventory/seed-sample?force=true');
      await fetchData();
    } catch (e) {
      alert('Error loading default catalogue: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    const randomCode = `SP-PRD-${Math.floor(100 + Math.random() * 900)}`;
    setFormData({
      itemCode: randomCode,
      itemName: '',
      category: 'Circuit Breaker',
      specification: '',
      brand: 'Sky Power Approved',
      uom: 'Nos',
      currentStock: 50,
      minReorderLevel: 10,
      unitCost: 1200,
      rackLocation: 'Bay 1 - Rack A1',
      imageUrl: '/products/mcb.svg',
      supplier: 'Sky Power Supplies',
      notes: '',
      submitting: false,
      error: ''
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category || 'Circuit Breaker',
      specification: item.specification || '',
      brand: item.brand || '',
      uom: item.uom || 'Nos',
      currentStock: item.currentStock || 0,
      minReorderLevel: item.minReorderLevel || 10,
      unitCost: item.unitCost || 0,
      rackLocation: item.rackLocation || '',
      imageUrl: item.imageUrl || '/products/mcb.svg',
      supplier: item.supplier || '',
      notes: item.notes || '',
      submitting: false,
      error: ''
    });
    setIsEditModalOpen(true);
  };

  // Open View Modal
  const openViewModal = (item) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  // Submit Add
  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!formData.itemCode.trim() || !formData.itemName.trim()) {
      setFormData((p) => ({ ...p, error: 'Product Code and Product Name are required.' }));
      return;
    }
    setFormData((p) => ({ ...p, submitting: true, error: '' }));
    try {
      await api.post('/inventory/items', {
        itemCode: formData.itemCode.trim().toUpperCase(),
        itemName: formData.itemName.trim(),
        category: formData.category,
        specification: formData.specification,
        brand: formData.brand,
        imageUrl: formData.imageUrl,
        uom: formData.uom,
        currentStock: Number(formData.currentStock) || 0,
        minReorderLevel: Number(formData.minReorderLevel) || 5,
        unitCost: Number(formData.unitCost) || 0,
        rackLocation: formData.rackLocation,
        supplier: formData.supplier,
        notes: formData.notes
      });
      setIsAddModalOpen(false);
      await fetchData();
    } catch (err) {
      setFormData((p) => ({ ...p, submitting: false, error: err.message || 'Failed to add product.' }));
    }
  };

  // Submit Edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setFormData((p) => ({ ...p, submitting: true, error: '' }));
    try {
      await api.put(`/inventory/items/${selectedItem._id}`, {
        itemName: formData.itemName.trim(),
        category: formData.category,
        specification: formData.specification,
        brand: formData.brand,
        imageUrl: formData.imageUrl,
        uom: formData.uom,
        minReorderLevel: Number(formData.minReorderLevel) || 5,
        unitCost: Number(formData.unitCost) || 0,
        rackLocation: formData.rackLocation,
        supplier: formData.supplier,
        notes: formData.notes
      });
      setIsEditModalOpen(false);
      await fetchData();
    } catch (err) {
      setFormData((p) => ({ ...p, submitting: false, error: err.message || 'Failed to update product.' }));
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    try {
      await api.delete(`/inventory/items/${selectedItem._id}`);
      setIsDeleteModalOpen(false);
      await fetchData();
    } catch (err) {
      alert('Failed to delete product: ' + err.message);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['#', 'Product Code', 'Product Name', 'Category', 'Unit', 'Stock Qty', 'Unit Cost', 'Status', 'Rack Location'];
    const rows = items.map((it, idx) => [
      idx + 1,
      it.itemCode,
      `"${(it.itemName || '').replace(/"/g, '""')}"`,
      it.category,
      it.uom,
      it.currentStock,
      it.unitCost,
      it.status,
      `"${it.rackLocation || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Product_Master_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  // Filter items by search query
  const filteredItems = items.filter((it) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.itemCode?.toLowerCase().includes(q) ||
      it.itemName?.toLowerCase().includes(q) ||
      it.category?.toLowerCase().includes(q) ||
      it.specification?.toLowerCase().includes(q)
    );
  });

  // Pagination slicing
  const totalProducts = stats?.totalItems || filteredItems.length;
  const inStockCount = stats?.inStockCount ?? filteredItems.filter((i) => i.currentStock > (i.minReorderLevel || 5)).length;
  const lowStockCount = stats?.lowStockCount ?? filteredItems.filter((i) => i.currentStock > 0 && i.currentStock <= (i.minReorderLevel || 5)).length;
  const outOfStockCount = stats?.outOfStockCount ?? filteredItems.filter((i) => i.currentStock <= 0).length;
  const totalStockQty = stats?.totalStockQty ?? filteredItems.reduce((acc, it) => acc + (it.currentStock || 0), 0);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const displayedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Category badge color map
  const getCategoryBadgeClass = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('circuit') || cat.includes('breaker') && !cat.includes('mccb')) {
      return 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'; // Green
    }
    if (cat.includes('contactor')) {
      return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'; // Amber
    }
    if (cat.includes('mccb')) {
      return 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]'; // Purple
    }
    if (cat.includes('panel')) {
      return 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'; // Blue
    }
    if (cat.includes('cable') || cat.includes('wire')) {
      return 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]'; // Orange
    }
    if (cat.includes('ct') || cat.includes('pt')) {
      return 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'; // Blue
    }
    if (cat.includes('relay')) {
      return 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]'; // Purple
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Status badge config
  const getStatusBadge = (item) => {
    const stock = item.currentStock || 0;
    const min = item.minReorderLevel || 5;

    if (stock <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECDD3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mr-1.5 shrink-0" />
          Out of Stock
        </span>
      );
    }
    if (stock <= min) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-1.5 shrink-0" />
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mr-1.5 shrink-0" />
        In Stock
      </span>
    );
  };

  // Default product image fallback helper
  const getProductImage = (item) => {
    if (item.imageUrl) return item.imageUrl;
    const cat = (item.category || '').toLowerCase();
    const name = (item.itemName || '').toLowerCase();
    if (name.includes('mcb') || cat.includes('circuit')) return '/products/mcb.svg';
    if (name.includes('contactor') || cat.includes('contactor')) return '/products/contactor.svg';
    if (name.includes('mccb') || cat.includes('mccb')) return '/products/mccb.svg';
    if (name.includes('panel') || cat.includes('panel')) return '/products/panel.svg';
    if (name.includes('cable') || cat.includes('cable')) return '/products/cable.svg';
    if (name.includes('ct') || cat.includes('ct')) return '/products/ct.svg';
    if (name.includes('relay') || cat.includes('relay')) return '/products/relay.svg';
    if (name.includes('vcb') || cat.includes('breaker')) return '/products/vcb.svg';
    if (name.includes('busbar') || cat.includes('busbar')) return '/products/busbar.svg';
    return '/products/mcb.svg';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs font-semibold">
        <span className="text-[#FF7A18] font-bold">Inventory &amp; Stores</span>
        <span className="text-slate-400">&gt;</span>
        <span className="text-slate-700 font-bold">Product Master</span>
      </div>

      {/* 2. Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          {/* Blue Cube Icon Box */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md" style={{ background: '#0A4076' }}>
            <Boxes className="w-7 h-7 text-[#38BDF8]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Product Master (Inventory)
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              View and manage all products with images, stock, and details.
            </p>
          </div>
        </div>

        {/* Action Buttons (+ Add Product, Import, Export) */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:opacity-95 cursor-pointer"
            style={{ background: '#059669' }}
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 3. Five Top Stat Metric Cards (Matching Screenshot) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Products */}
        <div className="p-4 rounded-2xl border transition-all duration-200" style={{ background: '#F0F8FF', borderColor: '#DCEBFA' }}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0284C7] shadow-2xs shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-600 block">Total Products</span>
              <span className="text-2xl font-black text-slate-900 leading-tight">
                {totalProducts}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: In Stock */}
        <div className="p-4 rounded-2xl border transition-all duration-200" style={{ background: '#F0FDF4', borderColor: '#DCFCE7' }}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#16A34A] shadow-2xs shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-600 block">In Stock</span>
              <span className="text-2xl font-black text-[#15803D] leading-tight">
                {inStockCount}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Low Stock */}
        <div className="p-4 rounded-2xl border transition-all duration-200" style={{ background: '#FFFBEB', borderColor: '#FEF3C7' }}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#D97706] shadow-2xs shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-600 block">Low Stock</span>
              <span className="text-2xl font-black text-[#B45309] leading-tight">
                {lowStockCount}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Out of Stock */}
        <div className="p-4 rounded-2xl border transition-all duration-200" style={{ background: '#FEF2F2', borderColor: '#FEE2E2' }}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#DC2626] shadow-2xs shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-600 block">Out of Stock</span>
              <span className="text-2xl font-black text-[#B91C1C] leading-tight">
                {outOfStockCount}
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Total Stock Qty */}
        <div className="p-4 rounded-2xl border transition-all duration-200 col-span-2 sm:col-span-1" style={{ background: '#FAF5FF', borderColor: '#F3E8FF' }}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#7C3AED] shadow-2xs shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-600 block">Total Stock Qty</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-black text-[#6D28D9] leading-tight">
                  {totalStockQty.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-[#7C3AED]">Units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Search & Filter Bar with View Switchers */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, code or category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0878C9]/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Status Dropdowns & View Switcher */}
        <div className="flex items-center space-x-2.5">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none text-xs font-bold py-2.5 pl-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0878C9]/20"
            >
              {CATEGORIES_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Stock Status Dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none text-xs font-bold py-2.5 pl-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0878C9]/20"
            >
              <option value="All Stock Status">All Stock Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View Toggles (List vs Grid) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl space-x-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Main Products Table (Matching Screenshot Columns & Row Design) */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-200 text-center">
          <div className="w-9 h-9 border-3 border-[#0878C9] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600">Loading Product Master Catalogue...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700 text-xs font-bold">
          {error}
        </div>
      ) : viewMode === 'LIST' ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-wider bg-slate-50/60">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4 w-20">Image</th>
                  <th className="py-3.5 px-4 w-36">Product Code</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4 w-36">Category</th>
                  <th className="py-3.5 px-4 w-20">Unit</th>
                  <th className="py-3.5 px-4 w-28 text-center">Stock Qty</th>
                  <th className="py-3.5 px-4 w-32">Status</th>
                  <th className="py-3.5 px-4 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-14 text-center text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p className="font-bold text-slate-600">No products match your filter criteria.</p>
                      <button
                        type="button"
                        onClick={handleSeedDefaults}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 cursor-pointer shadow-2xs"
                      >
                        Load Standard Switchgear Products
                      </button>
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((item, index) => {
                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                    const catBadgeClass = getCategoryBadgeClass(item.category);

                    return (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Row Index (#) */}
                        <td className="py-3 px-4 text-center font-bold text-slate-500">
                          {rowNumber}
                        </td>

                        {/* 2. Product Image Thumbnail */}
                        <td className="py-3 px-4">
                          <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={getProductImage(item)}
                              alt={item.itemName}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.src = '/products/mcb.svg';
                              }}
                            />
                          </div>
                        </td>

                        {/* 3. Product Code (Pill Badge) */}
                        <td className="py-3 px-4">
                          <span
                            className="inline-block px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-tight"
                            style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}
                          >
                            {item.itemCode}
                          </span>
                        </td>

                        {/* 4. Product Name */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block text-xs">
                            {item.itemName}
                          </span>
                          {item.specification && (
                            <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                              {item.specification}
                            </span>
                          )}
                        </td>

                        {/* 5. Category (Pastel Pill) */}
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${catBadgeClass}`}>
                            {item.category || 'General'}
                          </span>
                        </td>

                        {/* 6. Unit (Nos / Meter / Kg) */}
                        <td className="py-3 px-4 text-slate-600 font-semibold text-xs">
                          {item.uom || 'Nos'}
                        </td>

                        {/* 7. Stock Qty (Bold black text) */}
                        <td className="py-3 px-4 text-center font-black text-slate-900 text-xs">
                          {(item.currentStock || 0).toLocaleString('en-IN')}
                        </td>

                        {/* 8. Status (Dot + Text) */}
                        <td className="py-3 px-4">
                          {getStatusBadge(item)}
                        </td>

                        {/* 9. Actions (Eye, Pencil, Trash) */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5 text-slate-400">
                            {/* View Eye */}
                            <button
                              type="button"
                              onClick={() => openViewModal(item)}
                              className="p-1 hover:text-[#0878C9] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="View Product Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit Pencil */}
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Trash */}
                            <button
                              type="button"
                              onClick={() => openDeleteModal(item)}
                              className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4 text-rose-400 hover:text-rose-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View Alternative */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedItems.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-full h-28 bg-slate-50 rounded-xl p-3 flex items-center justify-center mb-3 border border-slate-100">
                  <img
                    src={getProductImage(item)}
                    alt={item.itemName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {item.itemCode}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(item.category)}`}>
                    {item.category}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{item.itemName}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{item.specification || 'Switchgear component'}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Stock Qty</span>
                  <span className="text-sm font-black text-slate-900">{item.currentStock} {item.uom}</span>
                </div>
                <div>{getStatusBadge(item)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Pagination Footer (Matching Screenshot) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2">
        <div className="font-medium">
          Showing <strong className="text-slate-800">{displayedItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> –{' '}
          <strong className="text-slate-800">{Math.min(currentPage * pageSize, filteredItems.length)}</strong> of{' '}
          <strong className="text-slate-800">{filteredItems.length}</strong> products
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            &laquo;
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              type="button"
              onClick={() => setCurrentPage(pg)}
              className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                currentPage === pg
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {pg}
            </button>
          ))}

          {totalPages > 5 && (
            <>
              <span className="px-1 text-slate-400">...</span>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  currentPage === totalPages
                    ? 'bg-[#0F172A] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            &raquo;
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW PRODUCT */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-[#059669] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <h3 className="text-sm font-bold">Add New Product to Inventory Master</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-5 space-y-3.5 overflow-y-auto">
              {formData.error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {formData.error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Product Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.itemCode}
                    onChange={(e) => setFormData((p) => ({ ...p, itemCode: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SP-CB-001"
                    className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      let img = '/products/mcb.svg';
                      if (cat.includes('Contactor')) img = '/products/contactor.svg';
                      if (cat.includes('MCCB')) img = '/products/mccb.svg';
                      if (cat.includes('Panel')) img = '/products/panel.svg';
                      if (cat.includes('Cable')) img = '/products/cable.svg';
                      if (cat.includes('CT')) img = '/products/ct.svg';
                      if (cat.includes('Relay')) img = '/products/relay.svg';
                      if (cat.includes('VCB')) img = '/products/vcb.svg';
                      if (cat.includes('Busbar')) img = '/products/busbar.svg';
                      setFormData((p) => ({ ...p, category: cat, imageUrl: img }));
                    }}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                  >
                    {CATEGORIES_LIST.filter((c) => c !== 'All Categories').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) => setFormData((p) => ({ ...p, itemName: e.target.value }))}
                  placeholder="e.g. MCB – 32A (1P)"
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Technical Specifications
                </label>
                <input
                  type="text"
                  value={formData.specification}
                  onChange={(e) => setFormData((p) => ({ ...p, specification: e.target.value }))}
                  placeholder="e.g. 32A, 10kA Breaking Capacity, C-Curve, 240V AC"
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.uom}
                    onChange={(e) => setFormData((p) => ({ ...p, uom: e.target.value }))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Meter">Meter</option>
                    <option value="Sets">Sets</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Initial Stock Qty *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData((p) => ({ ...p, currentStock: e.target.value }))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Min Reorder Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minReorderLevel}
                    onChange={(e) => setFormData((p) => ({ ...p, minReorderLevel: e.target.value }))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Unit Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => setFormData((p) => ({ ...p, unitCost: e.target.value }))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Rack / Storage Location
                  </label>
                  <input
                    type="text"
                    value={formData.rackLocation}
                    onChange={(e) => setFormData((p) => ({ ...p, rackLocation: e.target.value }))}
                    placeholder="e.g. Rack B1 - Bin 04"
                    className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Product Thumbnail Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Select Product Icon Thumbnail
                </label>
                <div className="flex items-center space-x-2">
                  {[
                    { label: 'MCB', src: '/products/mcb.svg' },
                    { label: 'Contactor', src: '/products/contactor.svg' },
                    { label: 'MCCB', src: '/products/mccb.svg' },
                    { label: 'Panel', src: '/products/panel.svg' },
                    { label: 'Cable', src: '/products/cable.svg' },
                    { label: 'CT', src: '/products/ct.svg' },
                    { label: 'Relay', src: '/products/relay.svg' },
                    { label: 'VCB', src: '/products/vcb.svg' }
                  ].map((ic) => (
                    <button
                      key={ic.src}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, imageUrl: ic.src }))}
                      className={`w-10 h-10 rounded-lg p-1 border flex items-center justify-center transition-all cursor-pointer ${
                        formData.imageUrl === ic.src
                          ? 'border-[#0878C9] bg-blue-50 ring-2 ring-[#0878C9]/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      title={ic.label}
                    >
                      <img src={ic.src} alt={ic.label} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formData.submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {formData.submitting ? 'Saving...' : 'Save Product →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT PRODUCT */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-[#0A4076] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4" />
                <h3 className="text-sm font-bold">Edit Product: {formData.itemCode}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-5 space-y-3.5 overflow-y-auto">
              {formData.error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {formData.error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) => setFormData((p) => ({ ...p, itemName: e.target.value }))}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                  >
                    {CATEGORIES_LIST.filter((c) => c !== 'All Categories').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.uom}
                    onChange={(e) => setFormData((p) => ({ ...p, uom: e.target.value }))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Meter">Meter</option>
                    <option value="Sets">Sets</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Technical Specifications
                </label>
                <input
                  type="text"
                  value={formData.specification}
                  onChange={(e) => setFormData((p) => ({ ...p, specification: e.target.value }))}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Min Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minReorderLevel}
                    onChange={(e) => setFormData((p) => ({ ...p, minReorderLevel: e.target.value }))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Unit Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => setFormData((p) => ({ ...p, unitCost: e.target.value }))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Rack / Storage Location
                </label>
                <input
                  type="text"
                  value={formData.rackLocation}
                  onChange={(e) => setFormData((p) => ({ ...p, rackLocation: e.target.value }))}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formData.submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0A4076] hover:bg-[#062B59] text-white shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {formData.submitting ? 'Updating...' : 'Update Product →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW PRODUCT DETAILS */}
      {/* ========================================================================= */}
      {isViewModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-[#0A4076] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-sky-300" />
                <h3 className="text-sm font-bold">Product Details: {selectedItem.itemCode}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                  <img
                    src={getProductImage(selectedItem)}
                    alt={selectedItem.itemName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedItem.itemCode}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{selectedItem.itemName}</h4>
                  <span className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-bold border mt-0.5 ${getCategoryBadgeClass(selectedItem.category)}`}>
                    {selectedItem.category}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-semibold block text-[10px]">Current Stock</span>
                  <span className="font-black text-slate-900 text-sm">{selectedItem.currentStock} {selectedItem.uom}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-semibold block text-[10px]">Stock Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedItem)}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-semibold block text-[10px]">Unit Cost</span>
                  <span className="font-black text-slate-900 text-sm">₹ {(selectedItem.unitCost || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-semibold block text-[10px]">Total Valuation</span>
                  <span className="font-black text-slate-900 text-sm">
                    ₹ {((selectedItem.currentStock || 0) * (selectedItem.unitCost || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {selectedItem.specification && (
                <div className="text-xs">
                  <span className="text-slate-500 font-bold block mb-0.5">Specification:</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                    {selectedItem.specification}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Location: <strong className="text-slate-800">{selectedItem.rackLocation || 'Bay 1'}</strong></span>
                <span>Supplier: <strong className="text-slate-800">{selectedItem.supplier || 'Approved Maker'}</strong></span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0A4076] text-white hover:bg-[#062B59] cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-rose-200 shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Product?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete <strong className="text-slate-800">[{selectedItem.itemCode}] {selectedItem.itemName}</strong>? This action cannot be undone.
            </p>

            <div className="mt-5 flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: IMPORT / EXPORT OPTIONS */}
      {/* ========================================================================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0878C9] mx-auto flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Import Product Catalogue</h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload a standard CSV or Excel file containing product codes, categories, units, and opening stock levels.
            </p>

            <div className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <span className="text-xs font-bold text-[#0878C9] block">Choose CSV File</span>
              <span className="text-[10px] text-slate-400">or drag and drop here</span>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('CSV template downloaded.');
                  setIsExportModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0878C9] hover:bg-[#062B59] text-white shadow-sm cursor-pointer"
              >
                Download Sample CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
