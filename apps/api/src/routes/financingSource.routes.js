import express from 'express';
import {
    createFinancingSource,
    getFinancingSources,
    updateFinancingSource,
    deleteFinancingSource,
} from '../controllers/cashflow/financingSource.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/financing-sources
router.post(
    '/',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    createFinancingSource
);

router.get(
    '/',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    getFinancingSources
);

router.put(
    '/:id',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    updateFinancingSource
);

router.delete(
    '/:id',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    deleteFinancingSource
);

export default router;
