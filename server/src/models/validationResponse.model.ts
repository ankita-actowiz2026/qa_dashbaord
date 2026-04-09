import mongoose from "mongoose";

const validationResponseSchema = new mongoose.Schema({
  accessFileName: {
    type: String,
    required: true,
  },
  feedName: {
    type: String,
  },
  originalFileName: {
    type: String,
  },
  response: {
    type: mongoose.Schema.Types.Mixed, // store full object directly
    required: true,
  },
  rules: {
    type: mongoose.Schema.Types.Mixed, // store full object directly
    required: true,
  },
});

// ✅ collection name = validationResponse
export const validationResponse = mongoose.model(
  "validationResponse",
  validationResponseSchema,
);
