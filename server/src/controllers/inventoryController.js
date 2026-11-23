import { InventoryItem, INVENTORY_CATEGORIES, STOCK_STATUSES } from '../models/InventoryItem.js';
import { StockTransaction, TRANSACTION_TYPES } from '../models/StockTransaction.js';
import { ProjectWorkflow } from '../models/ProjectWorkflow.js';

// Generate Unique Transaction Number
const generateTransactionNo = (prefix = 'TXN') => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomSuffix}`;
};

/**
 * 1. Get all inventory items with filtering & search
 */
export const getAllItems = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const filter = {};

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { itemCode: searchRegex },
        { itemName: searchRegex },
        { specification: searchRegex },
        { brand: searchRegex },
        { rackLocation: searchRegex },
        { supplier: searchRegex }
      ];
    }

    const items = await InventoryItem.find(filter);
    items.sort((a, b) => {
      const numA = parseInt((a.itemCode || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.itemCode || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return (a.itemCode || '').localeCompare(b.itemCode || '');
    });
    return res.status(200).json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory items.',
      error: error.message
    });
  }
};

/**
 * 2. Get single inventory item details & history
 */
export const getItemById = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    const recentTransactions = await StockTransaction.find({ itemId: item._id })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      item,
      recentTransactions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving item.', error: error.message });
  }
};

/**
 * 3. Create a new Inventory Master Item
 */
export const createItem = async (req, res) => {
  try {
    const {
      itemCode,
      itemName,
      category,
      subcategory,
      specification,
      brand,
      imageUrl,
      uom,
      currentStock,
      minReorderLevel,
      unitCost,
      rackLocation,
      supplier,
      notes
    } = req.body;

    if (!itemCode || !itemName) {
      return res.status(400).json({ success: false, message: 'Item Code and Item Name are mandatory.' });
    }

    const cleanCode = itemCode.trim().toUpperCase();
    const existing = await InventoryItem.findOne({ itemCode: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Item with code ${cleanCode} already exists.` });
    }

    const initialStock = Number(currentStock) || 0;
    const unitPrice = Number(unitCost) || 0;

    const newItem = await InventoryItem.create({
      itemCode: cleanCode,
      itemName: itemName.trim(),
      category: category || INVENTORY_CATEGORIES.CT_PT,
      subcategory: subcategory?.trim() || '',
      specification: specification?.trim() || '',
      brand: brand?.trim() || 'Sky Power Approved',
      imageUrl: imageUrl?.trim() || '',
      uom: (uom || 'NOS').toUpperCase().trim(),
      currentStock: initialStock,
      minReorderLevel: Number(minReorderLevel) || 5,
      unitCost: unitPrice,
      rackLocation: rackLocation?.trim() || 'Central Stores Bay 1',
      supplier: supplier?.trim() || '',
      notes: notes?.trim() || '',
      createdBy: req.user?._id,
      lastUpdatedBy: req.user?._id
    });

    // If initial stock was provided, create an opening INWARD transaction
    if (initialStock > 0) {
      await StockTransaction.create({
        transactionNumber: generateTransactionNo('OPN'),
        itemId: newItem._id,
        itemCode: newItem.itemCode,
        itemName: newItem.itemName,
        transactionType: TRANSACTION_TYPES.INWARD,
        quantity: initialStock,
        previousStock: 0,
        newStock: initialStock,
        unitRate: unitPrice,
        totalAmount: initialStock * unitPrice,
        referenceNumber: 'INITIAL-OPENING-STOCK',
        departmentStage: 'Stores',
        vendorOrRecipient: supplier || 'Initial Setup',
        remarks: 'Opening inventory balance added by Stock Admin',
        performedBy: req.user?._id,
        performedByName: req.user?.name || 'Stock Admin',
        performedByRole: req.user?.role || 'STOCK_ADMIN'
      });
    }

    return res.status(201).json({
      success: true,
      message: `Stock item "${newItem.itemName}" created successfully.`,
      item: newItem
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return res.status(500).json({ success: false, message: 'Failed to create inventory item.', error: error.message });
  }
};

/**
 * 4. Update an existing Inventory Item
 */
export const updateItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    const updatableFields = [
      'itemName',
      'category',
      'subcategory',
      'specification',
      'brand',
      'imageUrl',
      'uom',
      'minReorderLevel',
      'unitCost',
      'rackLocation',
      'supplier',
      'notes'
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    item.lastUpdatedBy = req.user?._id;
    await item.save();

    return res.status(200).json({
      success: true,
      message: 'Item updated successfully.',
      item
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update item.', error: error.message });
  }
};

/**
 * 5. Delete an Inventory Item
 */
export const deleteItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    await StockTransaction.deleteMany({ itemId: item._id });
    await InventoryItem.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: `Item ${item.itemCode} and associated logs removed.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete item.', error: error.message });
  }
};

/**
 * 6. Stock Inward (Add Stock / GRN / Supplier Delivery)
 */
export const stockInward = async (req, res) => {
  try {
    const {
      itemId,
      quantity,
      unitRate,
      referenceNumber,
      supplier,
      rackLocation,
      remarks
    } = req.body;

    if (!itemId || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid Item ID and positive Inward Quantity are mandatory.'
      });
    }

    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    const qtyIn = Number(quantity);
    const prevStock = item.currentStock || 0;
    const newStock = prevStock + qtyIn;
    const rate = unitRate !== undefined ? Number(unitRate) : (item.unitCost || 0);

    // Update item stock
    item.currentStock = newStock;
    if (unitRate !== undefined && Number(unitRate) > 0) {
      item.unitCost = Number(unitRate);
    }
    if (rackLocation) {
      item.rackLocation = rackLocation.trim();
    }
    if (supplier) {
      item.supplier = supplier.trim();
    }
    item.lastUpdatedBy = req.user?._id;
    await item.save();

    // Create transaction log
    const transaction = await StockTransaction.create({
      transactionNumber: generateTransactionNo('GRN'),
      itemId: item._id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      transactionType: TRANSACTION_TYPES.INWARD,
      quantity: qtyIn,
      previousStock: prevStock,
      newStock: newStock,
      unitRate: rate,
      totalAmount: qtyIn * rate,
      referenceNumber: referenceNumber || 'GRN-INWARD',
      departmentStage: 'Central Stores',
      vendorOrRecipient: supplier || item.supplier || 'Approved Vendor',
      remarks: remarks || `Stock Inward of ${qtyIn} ${item.uom} received into stores.`,
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Stock Admin',
      performedByRole: req.user?.role || 'STOCK_ADMIN'
    });

    return res.status(200).json({
      success: true,
      message: `Successfully received ${qtyIn} ${item.uom} of ${item.itemName}. Current stock: ${newStock} ${item.uom}.`,
      item,
      transaction
    });
  } catch (error) {
    console.error('Error processing stock inward:', error);
    return res.status(500).json({ success: false, message: 'Stock inward failed.', error: error.message });
  }
};

/**
 * 7. Stock Outward (Issue Stock to Project or Manufacturing Stage)
 */
export const stockOutward = async (req, res) => {
  try {
    const {
      itemId,
      quantity,
      projectTrackingId,
      departmentStage,
      issuedTo,
      referenceNumber,
      remarks
    } = req.body;

    if (!itemId || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid Item ID and positive Issue Quantity are mandatory.'
      });
    }

    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    const qtyOut = Number(quantity);
    const prevStock = item.currentStock || 0;

    if (prevStock < qtyOut) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock! Requested ${qtyOut} ${item.uom}, but only ${prevStock} ${item.uom} is available in stores.`
      });
    }

    const newStock = prevStock - qtyOut;

    item.currentStock = newStock;
    item.lastUpdatedBy = req.user?._id;
    await item.save();

    // Create transaction log
    const transaction = await StockTransaction.create({
      transactionNumber: generateTransactionNo('ISS'),
      itemId: item._id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      transactionType: TRANSACTION_TYPES.OUTWARD,
      quantity: qtyOut,
      previousStock: prevStock,
      newStock: newStock,
      unitRate: item.unitCost || 0,
      totalAmount: qtyOut * (item.unitCost || 0),
      referenceNumber: referenceNumber || (projectTrackingId ? `ISSUE-${projectTrackingId}` : 'ISSUE-PROD'),
      projectTrackingId: projectTrackingId?.trim() || '',
      departmentStage: departmentStage?.trim() || 'Stage 5: CT & PT',
      vendorOrRecipient: issuedTo?.trim() || 'Assembly Technician',
      remarks: remarks || `Issued ${qtyOut} ${item.uom} for project ${projectTrackingId || 'Shop Floor Production'}.`,
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Stock Admin',
      performedByRole: req.user?.role || 'STOCK_ADMIN'
    });

    return res.status(200).json({
      success: true,
      message: `Issued ${qtyOut} ${item.uom} of ${item.itemName} to ${projectTrackingId || 'Production'}. Remaining stock: ${newStock} ${item.uom}.`,
      item,
      transaction
    });
  } catch (error) {
    console.error('Error issuing stock outward:', error);
    return res.status(500).json({ success: false, message: 'Stock outward failed.', error: error.message });
  }
};

/**
 * 8. Get Stock Transactions / Audit Trail
 */
export const getStockTransactions = async (req, res) => {
  try {
    const { itemId, projectTrackingId, type, limit = 50 } = req.query;
    const filter = {};

    if (itemId) filter.itemId = itemId;
    if (projectTrackingId) filter.projectTrackingId = projectTrackingId;
    if (type && type !== 'ALL') filter.transactionType = type;

    const transactions = await StockTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving transactions.', error: error.message });
  }
};

/**
 * 9. Get Inventory Summary Stats for KPIs
 */
export const getInventorySummaryStats = async (req, res) => {
  try {
    const allItems = await InventoryItem.find();

    let totalItems = allItems.length;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockQty = 0;
    let totalInventoryValue = 0;

    allItems.forEach((it) => {
      const stock = it.currentStock || 0;
      const min = it.minReorderLevel || 5;
      const cost = it.unitCost || 0;

      totalStockQty += stock;
      totalInventoryValue += stock * cost;

      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= min) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    const recentTransactions = await StockTransaction.find()
      .sort({ createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      stats: {
        totalItems,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        totalStockQty,
        totalInventoryValue: Math.round(totalInventoryValue),
        recentTransactions
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to compute inventory stats.', error: error.message });
  }
};

/**
 * 10. Get Material Stock Status for a Project Tracking ID
 */
export const getProjectStockStatus = async (req, res) => {
  try {
    const { trackingId } = req.params;

    // Retrieve transactions issued to this specific project
    const issuedMaterials = await StockTransaction.find({
      projectTrackingId: trackingId,
      transactionType: TRANSACTION_TYPES.OUTWARD
    }).sort({ createdAt: -1 });

    // Retrieve critical components availability in stores
    const criticalComponents = await InventoryItem.find({
      category: {
        $in: [
          INVENTORY_CATEGORIES.CT_PT,
          INVENTORY_CATEGORIES.RELAYS,
          INVENTORY_CATEGORIES.SWITCHGEAR_BREAKER,
          INVENTORY_CATEGORIES.BUSBAR_COPPER
        ]
      }
    }).sort({ currentStock: -1 });

    return res.status(200).json({
      success: true,
      trackingId,
      issuedMaterials,
      criticalComponents
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch project stock details.', error: error.message });
  }
};

/**
 * 11. Seed Sample Switchgear Inventory
 */
export const seedSampleInventory = async (req, res) => {
  try {
    const count = await InventoryItem.countDocuments();
    if (count > 0 && req.query.force !== 'true') {
      return res.status(200).json({
        success: true,
        message: `Inventory already has ${count} items. Pass ?force=true to reload defaults.`
      });
    }

    if (req.query.force === 'true') {
      await InventoryItem.deleteMany({});
      await StockTransaction.deleteMany({});
    }

    const defaultItems = [
      {
        itemCode: 'SP-CB-001',
        itemName: 'MCB – 32A (1P)',
        category: 'Circuit Breaker',
        subcategory: 'Single Pole Miniature Circuit Breaker',
        specification: '32A, 10kA Breaking Capacity, C-Curve, 240V AC, IS/IEC 60898-1',
        brand: 'Schneider Electric / L&T',
        imageUrl: '/products/mcb.svg',
        uom: 'Nos',
        currentStock: 560,
        minReorderLevel: 50,
        unitCost: 320,
        rackLocation: 'Rack B1 - Bin 04',
        supplier: 'L&T Electrical & Automation'
      },
      {
        itemCode: 'SP-CON-002',
        itemName: 'Contactor – 40A',
        category: 'Contactor',
        subcategory: '3-Pole Power Contactor with 1NO+1NC',
        specification: '40A AC-3 Duty, 18.5kW, 230V AC Coil, 50Hz, IEC 60947-4-1',
        brand: 'Schneider Electric (TeSys Deca)',
        imageUrl: '/products/contactor.svg',
        uom: 'Nos',
        currentStock: 84,
        minReorderLevel: 100,
        unitCost: 1850,
        rackLocation: 'Rack B2 - Bin 11',
        supplier: 'Schneider Electric India'
      },
      {
        itemCode: 'SP-MCCB-003',
        itemName: 'MCCB – 100A',
        category: 'MCCB',
        subcategory: '3-Pole Molded Case Circuit Breaker',
        specification: '100A Normal, 36kA Breaking Capacity at 415V AC, Thermal Magnetic Trip',
        brand: 'L&T Switchgear (dsine)',
        imageUrl: '/products/mccb.svg',
        uom: 'Nos',
        currentStock: 32,
        minReorderLevel: 50,
        unitCost: 4800,
        rackLocation: 'Bay 3 - Rack M1',
        supplier: 'Larsen & Toubro Ltd'
      },
      {
        itemCode: 'SP-PNL-004',
        itemName: 'Control Panel – 4 Way',
        category: 'Panel',
        subcategory: 'Wall Mount Industrial Distribution Enclosure',
        specification: 'IP65 Rated CRCA Sheet 1.6mm, 4-Way Feeder with R/Y/B Indicators & Digital Voltmeter',
        brand: 'Sky Power Enclosures',
        imageUrl: '/products/panel.svg',
        uom: 'Nos',
        currentStock: 0,
        minReorderLevel: 10,
        unitCost: 14500,
        rackLocation: 'Fabrication Yard F-02',
        supplier: 'Sky Power Switchgears Internal'
      },
      {
        itemCode: 'SP-CAB-005',
        itemName: 'Power Cable – 4 Sq.mm',
        category: 'Cable',
        subcategory: '4-Core Flexible Copper Power Cable',
        specification: '4 Core x 4 sq.mm 1100V Grade FRLS PVC Insulated Copper Conductor, IS 694',
        brand: 'Polycab / Havells',
        imageUrl: '/products/cable.svg',
        uom: 'Meter',
        currentStock: 2150,
        minReorderLevel: 500,
        unitCost: 95,
        rackLocation: 'Cable Drums Yard C-01',
        supplier: 'Polycab India Ltd'
      },
      {
        itemCode: 'SP-CT-006',
        itemName: 'Current Transformer 800/5A Class 0.2S',
        category: 'CT & PT Coils',
        subcategory: 'Cast Resin Ring Type CT',
        specification: '800/5A, 15VA Burden, Class 0.2S, 11kV Insulation, IS 2705',
        brand: 'Pragati Electricals',
        imageUrl: '/products/ct.svg',
        uom: 'Nos',
        currentStock: 18,
        minReorderLevel: 6,
        unitCost: 4500,
        rackLocation: 'Bay 2 - Rack A1',
        supplier: 'Pragati Electricals Pvt Ltd'
      },
      {
        itemCode: 'SP-REL-007',
        itemName: 'Numerical Overcurrent & Earth Fault Relay',
        category: 'Protection & Aux Relays',
        subcategory: 'Microprocessor Protection Relay',
        specification: '3 O/C + 1 E/F, IEC 60255, RS485 Modbus Communication, 24-240V AC/DC',
        brand: 'Schneider Electric (MiCOM P111)',
        imageUrl: '/products/relay.svg',
        uom: 'Nos',
        currentStock: 8,
        minReorderLevel: 3,
        unitCost: 34000,
        rackLocation: 'Relay Store - Bin C1',
        supplier: 'Schneider Electric India'
      },
      {
        itemCode: 'SP-VCB-008',
        itemName: '11kV Vacuum Circuit Breaker 630A 25kA',
        category: 'Switchgear & VCB / ACB',
        subcategory: 'Indoor Withdrawable VCB Truck',
        specification: '12kV Max, 630A Rated Normal Current, 25kA 3-Sec Breaking, Motorised Spring 230V AC',
        brand: 'L&T Switchgear',
        imageUrl: '/products/vcb.svg',
        uom: 'Nos',
        currentStock: 4,
        minReorderLevel: 2,
        unitCost: 185000,
        rackLocation: 'Heavy Breaker Bay H1',
        supplier: 'Larsen & Toubro Ltd'
      },
      {
        itemCode: 'SP-BUS-009',
        itemName: 'Electrolytic Tough Pitch Copper Busbar 50x10mm',
        category: 'Copper & Aluminum Busbars',
        subcategory: 'ETP High Conductivity Copper',
        specification: '50mm x 10mm Flat Busbar, 99.9% Pure Copper, IS 613',
        brand: 'Sterlite / Hindalco',
        imageUrl: '/products/busbar.svg',
        uom: 'Kg',
        currentStock: 450,
        minReorderLevel: 100,
        unitCost: 890,
        rackLocation: 'Copper Store - Rack Cu-1',
        supplier: 'Metals & Alloys Corporation'
      },
      {
        itemCode: 'SP-PT-010',
        itemName: 'Potential Transformer 11kV / 110V 3-Phase',
        category: 'CT & PT Coils',
        subcategory: 'Cast Resin Voltage Transformer',
        specification: '11000V / √3 to 110V / √3, 50VA, Class 0.5, 50Hz',
        brand: 'Pragati Electricals',
        imageUrl: '/products/ct.svg',
        uom: 'Sets',
        currentStock: 6,
        minReorderLevel: 2,
        unitCost: 22000,
        rackLocation: 'Bay 2 - Rack A4',
        supplier: 'Pragati Electricals Pvt Ltd'
      },
      {
        itemCode: 'SP-MFM-011',
        itemName: 'Digital Multi-Function Energy Meter',
        category: 'Panel',
        subcategory: 'Panel Flush Mount Meter 96x96',
        specification: 'V, I, Hz, PF, kW, kVA, kWh, Class 0.5S Accuracy, RS485 Modbus',
        brand: 'Schneider Electric / Conzerv',
        imageUrl: '/products/panel.svg',
        uom: 'Nos',
        currentStock: 16,
        minReorderLevel: 5,
        unitCost: 8200,
        rackLocation: 'Instrument Store Bin M2',
        supplier: 'Schneider Electric India'
      }
    ];

    const createdItems = await InventoryItem.insertMany(defaultItems);

    // Create opening transactions for seeded stock
    for (const it of createdItems) {
      await StockTransaction.create({
        transactionNumber: generateTransactionNo('OPN'),
        itemId: it._id,
        itemCode: it.itemCode,
        itemName: it.itemName,
        transactionType: TRANSACTION_TYPES.INWARD,
        quantity: it.currentStock,
        previousStock: 0,
        newStock: it.currentStock,
        unitRate: it.unitCost,
        totalAmount: it.currentStock * it.unitCost,
        referenceNumber: 'SEEDED-STOCK-REGISTER',
        departmentStage: 'Stores',
        vendorOrRecipient: it.supplier,
        remarks: 'Master switchgear stock initialized by Stock Admin',
        performedByName: 'Stock Admin',
        performedByRole: 'STOCK_ADMIN'
      });
    }

    return res.status(201).json({
      success: true,
      message: `Successfully initialized ${createdItems.length} switchgear stock items.`,
      items: createdItems
    });
  } catch (error) {
    console.error('Error seeding inventory items:', error);
    return res.status(500).json({ success: false, message: 'Failed to seed inventory.', error: error.message });
  }
};
