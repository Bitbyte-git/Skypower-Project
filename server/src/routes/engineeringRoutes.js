import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getEngineeringDashboardStats,
  getAllEngineeringProjects,
  createEngineeringProjectFromOrder,
  getEngineeringProjectById,
  updateEngineeringProject,
  updateTechnicalSpecifications,
  getAllDrawings,
  createDrawing,
  uploadDrawingFile,
  recordInternalReview,
  createDrawingRevision,
  recordCustomerApproval,
  getAllSubmissions,
  createDrawingSubmission,
  recordSubmissionResponse,
  getAllClarifications,
  createTechnicalClarification,
  updateTechnicalClarification,
  seedSampleEngineeringProjects,
  syncEngineeringOrdersController
} from '../controllers/engineeringController.js';

const router = Router();

// All engineering routes require authenticated user
router.use(requireAuth);

// Dashboard
router.get('/dashboard/stats', getEngineeringDashboardStats);
router.post('/seed-samples', seedSampleEngineeringProjects);
router.post('/sync-orders', syncEngineeringOrdersController);

// Projects
router.get('/projects', getAllEngineeringProjects);
router.post('/projects/from-order', createEngineeringProjectFromOrder);
router.get('/projects/:id', getEngineeringProjectById);
router.put('/projects/:id', updateEngineeringProject);
router.put('/projects/:id/specs', updateTechnicalSpecifications);

// Drawings
router.get('/drawings', getAllDrawings);
router.post('/drawings', createDrawing);
router.post('/drawings/:id/upload', upload.single('file'), uploadDrawingFile);
router.post('/drawings/:id/review', recordInternalReview);
router.post('/drawings/:id/revision', upload.single('file'), createDrawingRevision);
router.post('/drawings/:id/customer-approval', upload.single('file'), recordCustomerApproval);

// Submissions
router.get('/submissions', getAllSubmissions);
router.post('/submissions', createDrawingSubmission);
router.post('/submissions/:id/response', upload.single('file'), recordSubmissionResponse);

// Technical Clarifications
router.get('/clarifications', getAllClarifications);
router.post('/clarifications', createTechnicalClarification);
router.put('/clarifications/:id', updateTechnicalClarification);

export default router;
