import asyncHandler from "express-async-handler";
import { AuthService } from "../../services/auth/auth.service.js";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const authService = new AuthService();

export const addUser = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  const requestedBy = req.user?.id;

  const user = await authService.addingUser({
    email,
    password,
    name,
    role,
    requestedBy,
  });

  return res.status(StatusCodes.CREATED).json(
    new ApiResponse(
      StatusCodes.CREATED,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role?.name || null,
        },
      },
      "User created successfully"
    )
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { token, user } = await authService.login({ email, password });

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });

  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { token, user }, "Login successful"));
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, null, "Logged out successfully"));
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const requesterId = req.user?.id;
  const roles = req.user?.roles || [];

  const isAdmin = roles.includes("Admin");

  const users = await authService.getAllUsers({
    requesterId,
    isAdmin,
  });

  res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, { users }, "Users fetched successfully")
    );
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await authService.deleteUser(id);

  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, null, "User deleted successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?.id;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});
