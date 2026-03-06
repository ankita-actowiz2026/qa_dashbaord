import mongoose, { Schema, Document } from "mongoose";
export interface IErrorDetail {
  row: number;
  column: string;
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
  user_id?: mongoose.Types.ObjectId;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
export interface  SummaryReportParams {
  user_id?: string
}
export interface SummaryReportQuery {
  user_id?: string
  page?: string
  limit?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
