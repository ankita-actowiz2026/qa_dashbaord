import mongoose from "mongoose";

const validationResponseSchema = new mongoose.Schema({
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

// ✅ collection name = validationResponse
export const validationResponse = mongoose.model(
  "validationResponse",
  validationResponseSchema
  
);
