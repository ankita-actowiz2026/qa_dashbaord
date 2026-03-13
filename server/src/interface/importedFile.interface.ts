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
  data_empty_count: number;
  datatype_error_count: number;
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
  sortOrder?: "asc" | "desc";
}
export interface SummaryReportParams {
  user_id?: string;
}
export interface SummaryReportQuery {
  user_id?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
export interface ColumnRule {
  name: string;
  data_type: "string" | "integer" | "number" | "boolean" | "date" | "email";
  has_empty?: boolean;
  data_redundant_value?: string | null;
  data_redundant_threshold?: number;
  length_validation_type?: "fixed" | "variable";
  min_length?: number | null | Date;
  max_length?: number | null | Date;
  max_date?: string | null | Date;
  min_date?: string | null | Date;
  date_format?: string;
  dateRegex?: RegExp;
  cellContainsRegex?: RegExp;
  cell_contains: boolean;
  cell_contains_value: string;
  not_match_found?: string[];
  fixed_header?: string[];
  cell_start_with?: string[];
  cell_end_with?: string[];
  dependency?: Record<string, any>;
  fixed_header_set?: Set<string>; //for faster speed validation of predefined values
  cell_start_with_normalized?: string[]; //for faster speed validation of start_with values
  cell_end_with_normalized?: string[]; //for faster speed validation of end_with values
  not_match_found_normalized?: string[]; //for faster speed validation of blocked words
  redundantCounter?: Map<string, number>;
  cellStartWithMessage: string;
  cellEndWithMessage: string;
}

export interface ParserResult {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  column_wise_stats: Record<string, any>;
}

export interface ColumnStats {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  empty_count: number;
  datatype_error_count: number;
  pattern_error_count: number;
  redundant_error_count: number;
  fixed_header_error_count: number;
  date_format_error_count: number;
  cell_start_with_end_with_error_count: number;
  length_validation_error_count: number;
  blocked_word_error_count: number;
  dependancy_error_count: number;
  error_msg: string[];
}
