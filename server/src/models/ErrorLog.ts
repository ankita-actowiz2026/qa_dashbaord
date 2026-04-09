import mongoose from "mongoose";

const errorLogSchema = new mongoose.Schema({
  fileName: { type: String, required: true, index: true },

  errors: [
    {
      rowNumber: Number,
      columnName: String,
      errorType: String,
      errorMsg: String,
    },
  ],
});

export const errorLog = mongoose.model("errorLog", errorLogSchema);
