import { Router } from 'express';
import { getUsers, createUser, toggleUserStatus } from '../controllers/userController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema } from '../validators/authValidators.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', getUsers);
router.post('/', validate(createUserSchema), createUser);
router.patch('/:id/status', toggleUserStatus);

export default router;

