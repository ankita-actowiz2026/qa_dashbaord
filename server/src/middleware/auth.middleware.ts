import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user.model";
import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error";

interface AuthRequest extends Request {
  user?: any;
}

export const authentication = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.adminToken || req.cookies.userToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const decoded: any = jwt.verify(token, process.env.ACCESS_SECRET!);

    const user = await User.findById(decoded.id).select(
      "_id first_name last_name email role",
    );

    if (!user || (user.role !== "QA" && user.role !== "Admin")) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.user = user;

    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authentication;
