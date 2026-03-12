import { ColumnRule } from "../../interface/importedFile.interface";
import {
  validateRow,
  prepareColumnRules,
} from "../../validations/user.importedFile.validations";

export const processRows = async (
  rows: any[],
  columnConfig: Record<string, ColumnRule>,
  errorSheet: any,
) => {
  const ruleMap: Record<string, ColumnRule> = columnConfig;
  prepareColumnRules(ruleMap);

  const headers = Object.keys(rows[0]);

  let total_rows = 0;
  let valid_rows = 0;
  let invalid_rows = 0;

  const columnStats: Record<string, any> = {};

  headers.forEach((header) => {
    columnStats[header] = {
      total_records: 0,
      valid_records: 0,
      invalid_records: 0,
      empty_count: 0,
      datatype_error_count: 0,
      pattern_error_count: 0,
      redundant_error_count: 0,
      fixed_header_error_count: 0,
      date_format_error_count: 0,
      cell_start_with_end_with_error_count: 0,
      length_validation_error_count: 0,
      blocked_word_error_count: 0,
      error_msg: [],
    };
  });

  for (let i = 0; i < rows.length; i++) {
    total_rows++;

    const rowData = rows[i];
    const rowNumber = i + 2;

    const rowValid = validateRow(
      rowData,
      rowNumber,
      headers,
      ruleMap,
      columnStats,
      errorSheet,
    );

    if (rowValid) valid_rows++;
    else invalid_rows++;
  }

  return {
    total_rows,
    valid_rows,
    invalid_rows,
    column_wise_stats: columnStats,
  };
};
