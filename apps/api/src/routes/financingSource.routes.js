import express from 'express';
import {
    createFinancingSource,
    getFinancingSources,
    updateFinancingSource,
    deleteFinancingSource,
} from '../controllers/cashflow/financingSource.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/financing-sources
router.post(
    '/',
    authMiddleware,
    authorizeRoles('Producer'),
    createFinancingSource
);

router.get(
    '/',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer', 'Accountant', 'Investor'),
    getFinancingSources
);

router.put(
    '/:id',
    authMiddleware,
    authorizeRoles('Producer'),
    updateFinancingSource
);

router.delete(
    '/:id',
    authMiddleware,
    authorizeRoles('Producer'),
    deleteFinancingSource
);

export default router;
