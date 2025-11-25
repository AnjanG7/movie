import express from 'express';
import {
    getCashflowForecast,
    upsertCashflowEntry,
    autoComputeCashflow,
    getCashflowSummary,
    recalculateCumulatives,
    deleteCashflowEntry,
} from '../controllers/cashflow/cashflow.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/cashflow
router.get(
    '/',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer', 'Accountant'),
    getCashflowForecast
);

router.post(
    '/',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer', 'Accountant'),
    upsertCashflowEntry
);

router.post(
    '/auto-compute',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer', 'Accountant'),
    autoComputeCashflow
);

router.get(
    '/summary',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer', 'Accountant'),
    getCashflowSummary
);

router.post(
    '/recalculate',
    authMiddleware,
    authorizeRoles('Producer', 'Accountant'),
    recalculateCumulatives
);

router.delete(
    '/:id',
    authMiddleware,
    authorizeRoles('Producer'),
    deleteCashflowEntry
);

export default router;
