import mongoose from "mongoose";

const cleanDataSchema = new mongoose.Schema(
  {
    importedfile_id: {
      type: mongoose.Schema.Types.ObjectId,     
      index: true
    },

    data: {
      type: mongoose.Schema.Types.Mixed,       
    }
  },
  {
    timestamps: true
  }
);

 const CleanDataModel = mongoose.model("CleanData",cleanDataSchema);
export default CleanDataModel;