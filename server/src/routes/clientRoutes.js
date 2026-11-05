import { Router } from 'express';
import {
  createClient,
  getClients,
  getClientById,
  updateClient
} from '../controllers/clientController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { clientSchema } from '../validators/clientValidators.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(clientSchema), createClient);
router.get('/', getClients);
router.get('/:id', getClientById);
router.put('/:id', validate(clientSchema), updateClient);

export default router;

