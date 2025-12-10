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
    authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
    createVendor
);

router.get(
    '/',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant', 'Dept Head'),
    getVendors
);

router.get(
    '/:id',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
    getVendor
);

router.put(
    '/:id',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
    updateVendor
);

router.delete(
    '/:id',
    authMiddleware,
    authorizeRoles("Admin",'Producer'),
    deleteVendor
);

export default router;
