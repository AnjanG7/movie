import express from 'express';
import {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrder,
    updatePOStatus,
    deletePurchaseOrder,
} from '../controllers/vendor/purchaseOrder.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/purchase-orders
router.post(
    '/',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer'),
    createPurchaseOrder
);

router.get(
    '/',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer', 'Accountant'),
    getPurchaseOrders
);

router.get(
    '/:id',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer', 'Accountant'),
    getPurchaseOrder
);

router.patch('/:id', authMiddleware, authorizeRoles('Producer', 'Line Producer'), updatePOStatus);


router.patch(
    '/:id/status',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer'),
    updatePOStatus
);

router.delete(
    '/:id',
    authMiddleware,
    authorizeRoles('Producer'),
    deletePurchaseOrder
);

export default router;
