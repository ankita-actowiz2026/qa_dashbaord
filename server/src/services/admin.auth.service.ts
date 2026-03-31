import User from "../models/user.model";
import IUser, {
  ILoginResponseAdmin,
  ILogin,
  UserType,
  IChangePassword,
  IUpdateProfile,
} from "../interface/user.interface";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ApiError from "../utils/api.error";

export class AuthService {
  async login(data: ILogin): Promise<ILoginResponseAdmin> {
    const user = await User.findOne({
      email: data.email,
      role: { $in: [UserType.ADMIN, UserType.QA] },
    });

    if (!user) {
      throw new ApiError("User not exist", 404);
    }

    const passwordMatched = await bcrypt.compare(data.password, user.password);
    if (!passwordMatched) {
      throw new ApiError("Invalid password", 401);
    }

    if (!process.env.ACCESS_SECRET || !process.env.REFRESH_SECRET) {
      throw new ApiError("ACCESS_SECRET or REFRESH_SECRET not configured", 500);
    }

    const adminToken = jwt.sign(
      { id: user._id, role: UserType.ADMIN },
      process.env.ACCESS_SECRET!,
      { expiresIn: "1d" },
    );

    const userObj = user.toObject();
    delete (userObj as any).password; // ✅ Remove password from response

    return { user: userObj, adminToken };
  }

  async changePassword(data: IChangePassword, user_id: any) {
    const { current_password, new_password } = data;
    console.log(user_id);

    const user = await User.findById(user_id);
    if (!user) {
      throw new ApiError("User not found");
    }

    const isMatch = await bcrypt.compare(current_password, user.password);

    if (!isMatch) {
      throw new ApiError("Current password is incorrect");
    }

    const isSame = await bcrypt.compare(new_password, user.password);
    if (isSame) {
      throw new ApiError("New password must be different from old password");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    user.password = hashedPassword;
    await user.save();

    return {
      message: "Password updated successfully",
    };
  }
  async updateProfile(data: IUpdateProfile, user_id: any) {
    const { first_name, last_name } = data;
    console.log("=========>" + user_id);
    // ✅ Find user
    const user = await User.findById(user_id);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ Update fields
    user.first_name = first_name;
    user.last_name = last_name;

    await user.save();

    return {
      message: "Profile updated successfully",
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
export const authService = new AuthService();
