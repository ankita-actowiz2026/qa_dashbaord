import  User  from "../models/user.model";
import  IUser ,{ILoginResponseAdmin, ILogin, UserType}  from "../interface/user.interface";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import  ApiError  from "../utils/api.error";
import crypto from "crypto";

export class AuthService {
 
  async login(data: ILogin ): Promise<ILoginResponseAdmin | null | String> {
    const user  = await User.findOne({"email":data.email,role: { $in: [UserType.ADMIN, UserType.QA] }})
    if(!user){        
        throw new ApiError("User not exist", 404);        
    }
    const passwordMatched = await bcrypt.compare(data.password, user.password );
    if(!passwordMatched){        
        throw new ApiError("Invalid password", 401);
    }

    if (!process.env.ACCESS_SECRET || !process.env.REFRESH_SECRET  ) {
      throw new ApiError("ACCESS_SECRET or REFRESH_SECRET not configured",500);
    }

    const adminToken = jwt.sign({ id: user._id ,role: UserType.ADMIN}, process.env.ACCESS_SECRET!, {
        expiresIn: "1d",
    });

    const userObj = user.toObject();
    delete (userObj as any).password;

    return {
      user: userObj, "adminToken":adminToken
    };
  }
}
export const authService = new AuthService();
