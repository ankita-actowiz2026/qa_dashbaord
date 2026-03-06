import { Request, Response, NextFunction } from "express";
import {authService} from "../services/user.auth.service";
import IUser, {ILogin} from "../interface/user.interface";
import  ApiError  from "../utils/api.error";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",  //secure: true work on https only
  sameSite: "lax" as const,
  path: "/", 
};
class AuthController {
  
    login = async (req: Request<{}, {},ILogin>, res: Response, next: NextFunction): Promise<void> => {
        try {
          const response = await authService.login(req.body);
          const { user, userToken } = response as { user: any; userToken: string;};
          res.cookie("userToken", userToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          }); 
          
          res.status(200).json({"success":true,"message":"Login successfully","data":{ user }});

        } catch (error:any) {         
          next(error);
        }
      };
    
    logout = async (req: Request, res: Response, next: NextFunction) => {
      try {
        res.clearCookie("userToken", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",   // IMPORTANT
          }); 
        return res.status(200).json({ success: true });
      } catch (err) {
          next(err);
      }
    }
    profile = async (req: Request, res: Response) => {
      res.json({
        success: true,
        data: req.user
      });
    };
}
export const authController = new AuthController();
