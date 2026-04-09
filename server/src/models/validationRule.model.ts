import mongoose, { Schema, Document } from "mongoose";
import IvalidationRule from "../interface/ValidationRule.interface";

const validationRuleSchema = new Schema<IvalidationRule>(
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

export const ValidationRule = mongoose.model<IvalidationRule>(
  "ValidationRules",
  validationRuleSchema,
);
