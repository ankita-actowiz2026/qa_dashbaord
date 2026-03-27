import { Request, Response, NextFunction } from "express";
import IUser, { ILogin } from "../interface/user.interface";

import { authService } from "../services/admin.auth.service";
class AuthController {
  login = async (
    req: Request<{}, {}, ILogin>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const response = await authService.login(req.body);
      const { user, adminToken } = response as {
        user: any;
        adminToken: string;
      };

      res.cookie("adminToken", adminToken, {
        httpOnly: true,
        secure: false, // ⚠️ Set true in production with HTTPS
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 7 days
      });

      res
        .status(200)
        .json({ success: true, message: "Login successfully", data: { user } });
    } catch (error: any) {
      next(error);
    }
  };
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie("adminToken", {
        httpOnly: true,
        secure: false, // ⚠️ Set true in production with HTTPS
        sameSite: "lax",
        path: "/", // ✅ Important
      });

      return res
        .status(200)
        .json({ success: true, message: "You are successfully logout" });
    } catch (err) {
      next(err);
    }
  };
  profile = async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: req.user, // ✅ Assumes `req.user` is set by middleware
    });
  };
}
export const authController = new AuthController();
