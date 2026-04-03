import mongoose, { Schema, Document } from "mongoose";

export default interface IFileRules extends Document {
  user_id: mongoose.Types.ObjectId;
  rules: any; // you can make this strict if needed
  createdAt: Date;
  updatedAt: Date;
}
