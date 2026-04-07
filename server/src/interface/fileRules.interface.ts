import mongoose, { Schema, Document } from "mongoose";

export default interface IFileRules extends Document {
  user_id: mongoose.Types.ObjectId;
  rules: any; // you can make this strict if needed
  file_name?: any;
  feed_name?: any;
  createdAt: Date;
  updatedAt: Date;
}
