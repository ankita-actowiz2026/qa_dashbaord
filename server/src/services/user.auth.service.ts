import User from "../models/user.model";
import  IUser ,{ILoginResponse, ILogin}  from "../interface/user.interface";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import  ApiError  from "../utils/api.error";
import { UserType } from "../interface/user.interface";

export class AuthService {
  async register(data: IUser ): Promise<IUser> {
    const result  = await User.findOne({"email":data.email})
    if(result){      
      throw new ApiError("User with email already exist", 409);
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);

    let user = await User.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: hashedPassword
    });
    return user;
  }
  async login(data: ILogin ): Promise<ILoginResponse | null | String> {
    const user  = await User.findOne({"email":data.email,"role":UserType.QA,status:"active"})
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
    const userToken = jwt.sign({ id: user._id ,role: UserType.QA}, process.env.ACCESS_SECRET!, {
        expiresIn: "1d",
    });
    const userObj = user.toObject();
   // delete (userObj as any).password;

    return {
      user: userObj, "userToken":userToken,
    };
  }



  async logout (): Promise<void> {
   
  };
}
export const authService = new AuthService();