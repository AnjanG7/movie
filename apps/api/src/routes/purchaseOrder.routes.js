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
    authorizeRoles("Admin",'Producer', 'Line Producer'),
    createPurchaseOrder
);

router.get(
    '/',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
    getPurchaseOrders
);

router.get(
    '/:id',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
    getPurchaseOrder
);

router.patch('/:id', authMiddleware, authorizeRoles("Admin",'Producer', 'Line Producer'), updatePOStatus);


router.patch(
    '/:id/status',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Line Producer'),
    updatePOStatus
);

router.delete(
    '/:id',
    authMiddleware,
    authorizeRoles("Admin",'Producer'),
    deletePurchaseOrder
);

export default router;
