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
  },
  {
    timestamps: true, // auto adds createdAt & updatedAt
  },
);

export const FileRules = mongoose.model<IFileRules>(
  "FileRules",
  FileRulesSchema,
);
