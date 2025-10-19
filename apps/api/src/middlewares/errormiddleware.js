
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  let customError = err;


  if (err.name === "PrismaClientValidationError") {
    customError = new ApiError(
      StatusCodes.BAD_REQUEST,
      "Validation error",
      [{ path: err.message.match(/Argument '([^']+)'/)?.[1] || "unknown", message: err.message.split("\n")[1] || err.message }]
    );
  } else if (err.name === "PrismaClientKnownRequestError") {
    switch (err.code) {
      case "P2002":
        customError = new ApiError(
          StatusCodes.BAD_REQUEST,
          "Unique constraint failed",
          err.meta?.target?.map((field) => ({
            path: field,
            message: `The value violates unique constraint on field '${field}'`,
          })) || []
        );
        break;
      case "P2003": 
        customError = new ApiError(
          StatusCodes.BAD_REQUEST,
          "Foreign key constraint failed",
          Object.keys(err.meta || {}).map((field) => ({
            path: field,
            message: `The referenced record for '${field}' does not exist`,
          })) || []
        );
        break;
      case "P2025": // Record not found
        customError = new ApiError(
          StatusCodes.NOT_FOUND,
          "Record not found",
          err.meta?.cause ? [{ path: "unknown", message: err.meta.cause }] : []
        );
        break;
      default:
        customError = new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          `Prisma error: ${err.code}`,
          [],
          err.stack
        );
    }
  }


  else if (err.name === "SyntaxError" && err.message.includes("JSON")) {
    customError = new ApiError(StatusCodes.BAD_REQUEST, "Invalid JSON payload", [
      { path: "body", message: err.message },
    ]);
  }


  else if (!(customError instanceof ApiError)) {
    customError = new ApiError(
      customError.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      customError.message || "Something went wrong",
      customError.errors || [],
      err.stack
    );
  }


  const response = {
    success: false,
    message: customError.message,
    errors: customError.errors || [],
    ...(process.env.NODE_ENV === "development"
      ? { stack: customError.stack }
      : {}),
  };

  return res.status(customError.statusCode).json(response);
};

export { errorHandler };
