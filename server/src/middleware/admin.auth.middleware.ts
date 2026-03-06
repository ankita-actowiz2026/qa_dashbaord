import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user.model";
import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error";

interface AuthRequest extends Request {
  user?: any;
}

export const authAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized admin" });
    }

    const decoded: any = jwt.verify(token, process.env.ACCESS_SECRET!);

    const user = await User.findById(decoded.id).select("_id name email role");

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.user = user;

    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authAdmin;