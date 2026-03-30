import { ColumnStats } from "../interface/importedFile.interface";

export const RULE_TO_STATS_MAP = {
  has_empty: ["empty_count"],
  data_type: ["datatype_error_count"],
  data_length: ["length_validation_error_count"],
  data_redundant: ["redundant_error_count"],
  regex: ["regex_pattern_error_count"],
  fixed_header: ["fixed_header_error_count"],
  cell_start_with: ["cell_start_with_error_count"],
  cell_end_with: ["cell_end_with_error_count"],
  not_match_found: ["blocked_word_error_count"],
  dependency: ["dependancy_error_count"],
};
export const errorMessageMap: Record<string, string> = {
  empty_count: "Value cannot be empty",
  datatype_error_count: "Datatype validation failed",
  regex_pattern_error_count: "Regex Pattern validation failed",
  redundant_error_count: "Duplicate value found",
  fixed_header_error_count: "Invalid header value",
  //date_format_error_count: "Invalid date format",
  cell_start_with_error_count:
    "Cell start with validation failed",
  cell_end_with_error_count:
    "Cell end with validation failed",  
  length_validation_error_count: "Length validation failed",
  blocked_word_error_count: "Blocked word found",
  dependancy_error_count: "Invalid dependancy",
};

export const importFileDefaultColumnStats: ColumnStats = {
  total_records: 0,
  valid_records: 0,
  invalid_records: 0,
  datatype_error_count: 0,
  empty_count: 0,
  regex_pattern_error_count: 0,
  length_validation_error_count: 0,
  redundant_error_count: 0,
  fixed_header_error_count: 0,
  //date_format_error_count: 0,
  cell_start_with_error_count: 0,
  cell_end_with_error_count: 0,
  blocked_word_error_count: 0,
  dependancy_error_count: 0,
  error_msg: [],
};
export const createColumnStats = (): ColumnStats => {
  return {
    ...importFileDefaultColumnStats,
    error_msg: [],
  };
};
