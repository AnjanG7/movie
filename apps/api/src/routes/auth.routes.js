import express from "express";
import { addUser, login, logout, deleteUser, getAllUsers } from "../controllers/auth/user.auth.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/rolemiddleware.js";

const router = express.Router();
router.post(
  "/add-user",
  authMiddleware,
  addUser 
);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.delete("/delete/:id", authMiddleware, authorizeRoles("Admin"), deleteUser);
router.get(
  "/allUsers",
  authMiddleware,
  authorizeRoles("Admin","Producer"),
  getAllUsers
);
export default router;
