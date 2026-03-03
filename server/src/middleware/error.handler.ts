import { Request, Response, NextFunction } from "express";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: Object.values(err.errors).map((e: any) => e.message).join(", "),
    });
    return;
  }

  // Duplicate key
  if (err.code === 11000) {
    res.status(400).json({
      success: false,
      message: `Duplicate field value: ${Object.keys(err.keyValue).join(", ")}`,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
export default errorHandler;