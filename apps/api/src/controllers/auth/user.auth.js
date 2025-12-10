import asyncHandler from "express-async-handler";
import { AuthService } from "../../services/auth/auth.service.js";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "../../utils/ApiResponse.js";
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
    const isAdmin = roles.includes("ADMIN");
  const users = await authService.getAllUsers({
    requesterId,
    isAdmin
  });
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { users }, "Users fetched successfully"));
});


export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await authService.deleteUser(id);

  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, null, "User deleted successfully"));
});

