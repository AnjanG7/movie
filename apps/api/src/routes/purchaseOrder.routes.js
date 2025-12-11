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
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/purchase-orders
router.post(
    '/',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    createPurchaseOrder
);

router.get(
    '/',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    getPurchaseOrders
);

router.get(
    '/:id',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    getPurchaseOrder
);

router.patch('/:id', authMiddleware, authorizeProjectRoles("Producer", "LineProducer", "Accountant"), updatePOStatus);


router.patch(
    '/:id/status',
    authMiddleware,
   authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    updatePOStatus
);

router.delete(
    '/:id',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    deletePurchaseOrder
);

export default router;
