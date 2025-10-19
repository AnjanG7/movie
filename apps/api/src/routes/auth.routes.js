import express from "express";
import { signup, login,logout } from "../controllers/auth/user.auth.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
export default router;
