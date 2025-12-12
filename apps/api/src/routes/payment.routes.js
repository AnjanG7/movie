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
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/payments
router.post(
    '/',
    authMiddleware,
 authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    createPayment
);

router.post(
    '/scheduled',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    createScheduledPayment
);

router.get(
    '/',
    authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    getPayments
);

router.get(
    '/scheduled/',
  authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    getScheduledPayments
);

router.get(
    '/:id',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    getPayment
);

router.patch(
    '/scheduled/:scheduledPaymentId/installments/:installmentId/pay',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    markInstallmentPaid
);

router.get(
    '/upcoming',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    getUpcomingPayments
);

export default router;
