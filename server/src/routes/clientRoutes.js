import { Router } from 'express';
import {
  createClient,
  getClients,
  getClientById,
  updateClient
} from '../controllers/clientController.js';
import { requireAuth, requireSalesOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { clientSchema } from '../validators/clientValidators.js';
import { enableCustomerPortalAccess, toggleCustomerPortalAccess } from '../controllers/portalController.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(clientSchema), createClient);
router.get('/', getClients);
router.get('/:id', getClientById);
router.put('/:id', validate(clientSchema), updateClient);

// Customer Portal Access Management
router.post('/:id/portal-access', requireSalesOrAdmin, enableCustomerPortalAccess);
router.post('/:id/portal-access/toggle', requireSalesOrAdmin, toggleCustomerPortalAccess);

export default router;

