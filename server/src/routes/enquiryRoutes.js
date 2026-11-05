import { Router } from 'express';
import {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  submitForApproval,
  uploadEnquiryDocument,
  handoverToRD
} from '../controllers/enquiryController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { enquirySchema } from '../validators/enquiryValidators.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(enquirySchema), createEnquiry);
router.get('/', getEnquiries);
router.get('/:id', getEnquiryById);
router.put('/:id', validate(enquirySchema), updateEnquiry);
router.post('/:id/submit', submitForApproval);
router.post('/:id/upload', upload.single('file'), uploadEnquiryDocument);
router.post('/:id/handover', handoverToRD);

export default router;

