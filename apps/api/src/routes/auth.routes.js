import express from "express";
import { signup, login,logout, deleteUser,getAllUsers } from "../controllers/auth/user.auth.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";

const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.delete("/delete/:id",authorizeRoles("Admin"), deleteUser);
router.get(
  "/allUsers",
  authMiddleware,
  authorizeRoles("Admin"),
  getAllUsers
);
export default router;
