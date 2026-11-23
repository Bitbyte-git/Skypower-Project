import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  stockInward,
  stockOutward,
  getStockTransactions,
  getInventorySummaryStats,
  getProjectStockStatus,
  seedSampleInventory
} from '../controllers/inventoryController.js';

const router = Router();

// All inventory endpoints require authentication
router.use(requireAuth);

// Summary statistics & KPI metrics
router.get('/stats', getInventorySummaryStats);

// Material status for a specific project tracking ID
router.get('/project/:trackingId', getProjectStockStatus);

// Seed sample switchgear inventory items
router.post('/seed-sample', seedSampleInventory);

// Transaction logs / audit trail
router.get('/transactions', getStockTransactions);

// Stock Inward (GRN / Add Stock)
router.post('/inward', stockInward);

// Stock Outward (Issue Stock to Project / Stage)
router.post('/outward', stockOutward);

// Items CRUD
router.get('/items', getAllItems);
router.get('/items/:id', getItemById);
router.post('/items', createItem);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

export default router;
