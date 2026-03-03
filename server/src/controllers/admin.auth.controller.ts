import { Request, Response, NextFunction } from "express";
import IUser, {ILogin} from "../interface/user.interface";

import { authService } from "../services/admin.auth.service";
class AuthController {
 login = async (req: Request<{}, {},ILogin>, res: Response, next: NextFunction): Promise<void> => {
        try {
          const response = await authService.login(req.body);
          const { user, accessToken,  } = response as { user: any; accessToken: string; };

          res.status(200).json({"success":true,"message":"Login successfully","data":{ user, accessToken }});

        } catch (error:any) {         
          next(error);
        }
      };
 logout = async (req: Request, res: Response, next: NextFunction) => {
      try {
                
        return res.status(200).json({ success: true,"message":"You are successfully logout" });
      } catch (err) {
          next(err);
      }
    }      
}
export const authController = new AuthController();
