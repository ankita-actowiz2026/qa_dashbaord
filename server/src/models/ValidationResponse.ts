import mongoose from "mongoose";

const ValidationResponseSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    unique: true,
  },

  column_wise_stats: {
    type: mongoose.Schema.Types.Mixed, // store full object directly
    required: true,
  },
});

// ✅ collection name = ValidatationResponse
export const ValidatationResponse = mongoose.model(
  "ValidatationResponse",
  ValidationResponseSchema,
  "ValidatationResponse", // exact collection name
);
