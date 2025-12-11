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
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/cashflow
router.get(
    '/',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    getCashflowForecast
);

router.post(
    '/',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    upsertCashflowEntry
);

router.post(
    '/auto-compute',
    authMiddleware,
 authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    autoComputeCashflow
);

router.get(
    '/summary',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    getCashflowSummary
);

router.post(
    '/recalculate',
    authMiddleware,
   authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    recalculateCumulatives
);

router.delete(
    '/:id',
    authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    deleteCashflowEntry
);

export default router;
