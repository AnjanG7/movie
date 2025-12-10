import express from 'express';
import {
    createDrawdown,
    getDrawdowns,
    deleteDrawdown,
} from '../controllers/cashflow/drawdown.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/drawdowns
router.post(
    '/',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Accountant'),
    createDrawdown
);

router.get(
    '/',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
    getDrawdowns
);

router.delete(
    '/:id',
    authMiddleware,
    authorizeRoles("Admin",'Producer'),
    deleteDrawdown
);

export default router;
