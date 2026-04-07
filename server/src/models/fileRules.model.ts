import mongoose, { Schema, Document } from "mongoose";
import IFileRules from "../interface/fileRules.interface";

const FileRulesSchema = new Schema<IFileRules>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    rules: {
      type: Schema.Types.Mixed, // flexible JSON
      required: true,
    },
    feed_name: {
      type: String,
      default: null,
    },
    file_name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // auto adds createdAt & updatedAt
  },
);

export const FileRules = mongoose.model<IFileRules>(
  "FileRules",
  FileRulesSchema,
);
