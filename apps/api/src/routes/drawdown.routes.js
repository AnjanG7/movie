import express from 'express';
import {
    createDrawdown,
    getDrawdowns,
    deleteDrawdown,
} from '../controllers/cashflow/drawdown.controller.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { authorizeRoles } from '../middlewares/rolemiddleware.js';
import { authorizeProjectRoles } from '../middlewares/projectRoles.middlware.js';

const router = express.Router({ mergeParams: true });

// Base: /api/projects/:projectId/drawdowns
router.post(
    '/',
    authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    createDrawdown
);

router.get(
    '/',
    authMiddleware,
authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    getDrawdowns
);

router.delete(
    '/:id',
    authMiddleware,
  authorizeProjectRoles("Producer", "LineProducer", "Accountant"),
    deleteDrawdown
);

export default router;
