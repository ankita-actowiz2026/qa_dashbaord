import  {Schema, model,} from 'mongoose'
import  IImportedFile, {IErrorDetail, IRuleDetail}  from "../interface/importedFile.interface";
const ErrorSchema = new Schema<IErrorDetail>(
  {
    row_number: { type: Number, required: true },
    column_name: { type: String, required: true, trim: true },
    error_type: { type: String, required: true },
    error_description: { type: String, required: true },
  },
  { _id: false } // prevent auto _id for each error item
);

const RuleSchema = new Schema<IRuleDetail>(
  {
    field_name: { type: String, required: true, trim: true },
    datatype: { type: String, required: true },
    is_required: { type: Boolean, default: false },
    allow_duplicate: { type: Boolean, default: false },
    allow_special_char: { type: Boolean, default: false },
    num_alphaNum_alpha: { type: String },
  },
  { _id: false }
);
const importedFileSchema = new Schema<IImportedFile>({
     user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",         
    },
    file_name: {
      type: String,      
      trim: true,
    },
    total_records: {
      type: Number,      
      default: 0,
    },
    valid_records: {
      type: Number,      
      default: 0,
    },
    invalid_records: {
      type: Number,    
      default: 0,
    },
    duplicate_count: {
      type: Number,
      default: 0,
    },
    missing_required_count: {
      type: Number,
      default: 0,
    },
    datatype_error_count: {
      type: Number,
      default: 0,
    },
    junk_character_count: {
      type: Number,
      default: 0,
    },
    error_msg: [ErrorSchema],
    rules: [RuleSchema],    
},{ timestamps: true })
 const ImportedFile = model<IImportedFile>('ImportedFile', importedFileSchema )
 export default ImportedFile