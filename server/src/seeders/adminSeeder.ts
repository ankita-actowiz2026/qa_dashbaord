import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/user.model";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.DB_URI as string);
    console.log("MongoDB connected");
    const email="admin@yopmail.com"
    const existingAdmin = await User.findOne({
      email: email,
      deletedAt: null,
    });

    if (existingAdmin) {
      await User.deleteOne({
      email: email,
      deletedAt: null,
    });
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await User.create({
      name: "Super Admin",
      email: email,
      password: hashedPassword,
      role: "Admin",
    });

    console.log("Admin created successfully 🚀");
    process.exit();
  } catch (error) {
    console.error("Seeder error:", error);
    process.exit(1);
  }
};

seedAdmin();