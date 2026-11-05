import { Router } from 'express';
import {
  createQuotation,
  reviseQuotation,
  getQuotations,
  getQuotationById
} from '../controllers/quotationController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createQuotationSchema,
  reviseQuotationSchema
} from '../validators/quotationValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/', getQuotations);
router.get('/:id', getQuotationById);

// Admin-only quotation generation & revisions
router.post('/', requireAdmin, validate(createQuotationSchema), createQuotation);
router.post('/:id/revise', requireAdmin, validate(reviseQuotationSchema), reviseQuotation);

export default router;

