import mongoose from "mongoose";

const DB_URI = process.env.DB_URI;

if (!DB_URI) {
  throw new Error("DB_URI is not defined in environment variables");
}

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(DB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); 
  }
};

export default connectDB;