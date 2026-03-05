import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user.model";
import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error";

interface AuthRequest extends Request {
  user?: any;
}

const authentication = async (req: AuthRequest, res: Response, next: NextFunction) => {
 try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded: any = jwt.verify(token, process.env.ACCESS_SECRET!);

    const user = await User.findById(decoded.id).select("-password");

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authentication;