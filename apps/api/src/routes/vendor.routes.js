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
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';
const router = express.Router({ mergeParams: true });

// Base: /api/vendors
router.post(
    '/',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    createVendor
);

router.get(
    '/',
    authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    getVendors
);

router.get(
    '/:id',
    authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    getVendor
);

router.put(
    '/:id',
    authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    updateVendor
);

router.delete(
    '/:id',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    deleteVendor
);

export default router;
