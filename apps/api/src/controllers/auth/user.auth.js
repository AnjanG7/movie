import asyncHandler from "express-async-handler";
import { AuthService } from "../../services/auth/auth.service.js";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "../../utils/ApiResponse.js";

const authService = new AuthService();

export const signup = asyncHandler(async (req, res) => {
  const { email, password, fullName, roleName } = req.body;

  const user = await authService.signup({
    email,
    password,
    fullName,
    roleName,
  });

  res.status(StatusCodes.CREATED).json(
    new ApiResponse(
      StatusCodes.CREATED,
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.name,
          roles: user.roles.map((r) => r.role.name),
        },
      },
      "User registered successfully"
    )
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await authService.login({ email, password });

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24,
  });

  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { token, user }, "Login successful"));
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/", 
  });

  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, null, "Logged out successfully"));
});
