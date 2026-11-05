import { Router } from 'express';
import {
  createFollowup,
  getFollowups,
  updateFollowup
} from '../controllers/followupController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createFollowupSchema,
  updateFollowupSchema
} from '../validators/followupValidators.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createFollowupSchema), createFollowup);
router.get('/', getFollowups);
router.put('/:id', validate(updateFollowupSchema), updateFollowup);

export default router;

