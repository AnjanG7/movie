import express from 'express';
import {
    createVendor,
    getVendors,
    getVendor,
    updateVendor,
    deleteVendor,
} from '../controllers/vendor/vendor.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';

const router = express.Router();

// Base: /api/vendors
router.post(
    '/',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer', 'Accountant'),
    createVendor
);

router.get(
    '/',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer', 'Accountant', 'Dept Head'),
    getVendors
);

router.get(
    '/:id',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer', 'Accountant'),
    getVendor
);

router.put(
    '/:id',
    authMiddleware,
    authorizeRoles('Producer', 'Line Producer', 'Accountant'),
    updateVendor
);

router.delete(
    '/:id',
    authMiddleware,
    authorizeRoles('Producer'),
    deleteVendor
);

export default router;
