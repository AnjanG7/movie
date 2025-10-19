import {verifyToken} from "../utils/helper.js"
import prisma from "../utils/prismaClient.js";
import { ApiError } from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export const authMiddleware = async (req, res, next) => {
  try {
 
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "No token provided");
    }

 
    const decoded = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
    }

    req.user = {
      id: user.id,
      email: user.email,
 roles: user.roles.map(r => r.role.name), 
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      next(new ApiError(StatusCodes.UNAUTHORIZED, "Token expired"));
    } else if (err.name === "JsonWebTokenError") {
      next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token"));
    } else {
      next(err);
    }
  }
};
