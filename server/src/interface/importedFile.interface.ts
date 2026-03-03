import mongoose, { Schema, Document } from "mongoose";
export interface IErrorDetail {
  row_number: number;
  column_name: string;
  error_type: string;
  error_description: string;
}

export interface IRuleDetail {
  field_name: string;
  datatype: string;
  is_required: boolean;
  allow_duplicate: boolean;
  allow_special_char: boolean;
  num_alphaNum_alpha: string;
}

export default interface IImportedFile {
  user_id: mongoose.Types.ObjectId;
  file_name: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_count: number;
  missing_required_count: number;
  datatype_error_count: number;
  junk_character_count: number;
  error_msg: IErrorDetail[];
  rules: IRuleDetail[];  
  createdAt: Date;
  updatedAt: Date;
}


export interface GetImportedFilesQuery {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}