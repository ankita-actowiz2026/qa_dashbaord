import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user.model";
import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error";

interface AuthRequest extends Request {
  user?: any;
}

const authentication = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError("Authorization header missing", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET!) as JwtPayload;
    if (!decoded || !decoded.id) {
      throw new ApiError("Invalid token payload", 401);
    }

    const user = await User.findById(decoded.id).select("_id email role");
    if (!user) {
      throw new ApiError("User not found", 401);
    }

    req.user = user;
    next();

  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError("Token expired", 401));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError("Invalid token", 401));
    }
    next(error);
  }
};

export default authentication;