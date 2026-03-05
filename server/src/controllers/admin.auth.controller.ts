import { Request, Response, NextFunction } from "express";
import IUser, {ILogin} from "../interface/user.interface";

import { authService } from "../services/admin.auth.service";
class AuthController {
 login = async (req: Request<{}, {},ILogin>, res: Response, next: NextFunction): Promise<void> => {
        try {
          const response = await authService.login(req.body);
          const { user, accessToken,  } = response as { user: any; accessToken: string; };
          res.cookie("accessToken", accessToken, {
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
          res.clearCookie("accessToken", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",   // IMPORTANT
          });       
        return res.status(200).json({ success: true,"message":"You are successfully logout" });
      } catch (err) {
          next(err);
      }
    }  
  me = async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: req.user
    });
  };    
}
export const authController = new AuthController();
