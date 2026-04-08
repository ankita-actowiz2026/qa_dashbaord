// models/ColumnErrors.ts
import mongoose from "mongoose";
const ColumnErrorSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, index: true },

    columnErrors: [
      {
        column: String,
        errors: [
          {
            errorType: String,
            message: String,
            count: Number,
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

export const ColumnErrors = mongoose.model("ColumnError", ColumnErrorSchema);
