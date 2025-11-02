
import { ApiError } from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];

    if (!userRoles.length) {
      return next(
        new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized: No user role found")
      );
    }

    // Check if any user role matches allowed roles
    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return next(new ApiError(StatusCodes.FORBIDDEN, "Forbidden: Access denied"));
    }

    next();
  };
};
