import express from 'express';
import {
    createPayment,
    createScheduledPayment,
    getPayments,
    getPayment,
    getScheduledPayments,
    markInstallmentPaid,
    getUpcomingPayments,
} from '../controllers/vendor/payment.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';

const router = express.Router();

// Base: /api/payments
router.post(
    '/',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Accountant'),
    createPayment
);

router.post(
    '/scheduled',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Accountant'),
    createScheduledPayment
);

router.get(
    '/',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
    getPayments
);

router.get(
    '/scheduled',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
    getScheduledPayments
);

router.get(
    '/:id',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
    getPayment
);

router.patch(
    '/scheduled/:scheduledPaymentId/installments/:installmentId/pay',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Accountant'),
    markInstallmentPaid
);

router.get(
    '/projects/:projectId/upcoming',
    authMiddleware,
    authorizeRoles("Admin",'Producer', 'Line Producer', 'Accountant'),
    getUpcomingPayments
);

export default router;
