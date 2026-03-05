import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user.model";
import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api.error";

interface AuthRequest extends Request {
  user?: any;
}

const authentication = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;

  if(!token){
    return res.status(401).json({success:false,message:"Unauthorized"});
  }

  try{
    const decoded = jwt.verify(token,process.env.ACCESS_SECRET!);
    req.user = decoded;
    next();
  }catch(err){
    return res.status(401).json({success:false,message:"Invalid token"});
  }

};

export default authentication;