import mongoose from "mongoose";

const ErrorLogSchema = new mongoose.Schema({
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

export const ErrorLog = mongoose.model("ErrorLog", ErrorLogSchema);
