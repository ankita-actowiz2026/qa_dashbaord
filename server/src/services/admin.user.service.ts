import User from "../models/user.model";
import  IUser,{UserType}  from "../interface/user.interface";
import  ApiError  from "../utils/api.error";
import { Types } from "mongoose";
import bcrypt from "bcrypt";


export class UserService {
  async createUser(data: IUser): Promise<IUser> {

    const email = data.email.toLowerCase().trim();    
    const status = data.status.toLowerCase().trim();    
    const existing = await User.findOne({ email: email });    
    if(existing){          
      throw new ApiError("Email already used", 409);     
    }    
    const hashedPassword = await bcrypt.hash(data.password, 10);    
    return User.create({
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      status: status,
      role: UserType.QA,     
    });
  }

  // async getUsers(): Promise<IUser[]> {
  //   return User.find({"role":UserType.QA}).sort({_id:-1});
  // }
 async getUsers(query: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const {
    search = '',
    page = 1,
    limit = 10,
    sortBy = '_id',
    sortOrder = 'desc',
  } = query;

  const skip = (page - 1) * limit;

  const searchQuery = {
  role:  UserType.QA,
  ...(search && {
    $or: [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } },
    ],
  }),
};
  const sortOptions: any = {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
  };


  const [data, total] = await Promise.all([
    User.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),

    User.countDocuments(searchQuery),
  ]);

  return {
    data,
    total,
    page,
    limit,
  };
}
  async getUser(id: string): Promise<IUser | null> {   
    if (!Types.ObjectId.isValid(id)) { 
        throw new ApiError("Invalid user id", 400);            
      }
    const user = await User.findById(id);
    if (!user) {        
        throw new ApiError("User not found", 404);
    }
    return user;
  }

  async updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) { 
        throw new ApiError("Invalid user id", 400);            
      }
      if (data.email) {
        const exists = await User.findOne({ email: data.email, _id: { $ne: id } });
        if (exists) {
          throw new ApiError("Email already used", 409);
        }
      }  
    const user = await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });   
    if (!user) {
      throw new ApiError("User not found", 404);
    }
    return user;
  }
  
  async deleteUser(id: string): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) { 
        throw new ApiError("Invalid user id", 400);            
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
     throw new ApiError("User not found", 404);
    }
    return user
  }
  async testUser(id: string): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid user id", 400);
    }

    const data = await User.findById(id); 
    if (!data) 
      throw new ApiError("User not found", 404);
    
    return data;
  }
}
export const userService = new UserService();
