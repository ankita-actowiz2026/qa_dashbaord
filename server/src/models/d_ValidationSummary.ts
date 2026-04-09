// models/ValidationSummary.ts
import mongoose from "mongoose";

const ValidationSummarySchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, index: true },

    errors: [
      {
        metric: String,
        column: String,
        value: mongoose.Schema.Types.Mixed, // number | null
      },
    ],
  },
  { timestamps: true },
);

export const ValidationSummary = mongoose.model(
  "ValidationSummary",
  ValidationSummarySchema,
);
