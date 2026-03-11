import ExcelJS from "exceljs";

import { ColumnRule } from "../../interface/importedFile.interface";
import {
  validateRow,
  prepareColumnRules,
} from "../../validations/user.importedFile.validations";

import fs from "fs";

export const parseJsonFile = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
  errorSheet: ExcelJS.Worksheet,
) => {
  const ruleMap = columnConfig;

  prepareColumnRules(ruleMap);

  let total_rows = 0;
  let valid_rows = 0;
  let invalid_rows = 0;

  const columnStats: Record<string, any> = {};

  // 📌 Read JSON file
  const fileContent = fs.readFileSync(filePath, "utf8");
  const jsonData = JSON.parse(fileContent);

  if (!Array.isArray(jsonData)) {
    throw new Error("JSON file must contain an array of objects");
  }

  // 📌 Get headers from first row
  const headers = Object.keys(jsonData[0]);

  // Initialize column stats
  for (const header of headers) {
    columnStats[header] = {
      total_records: 0,
      valid_records: 0,
      invalid_records: 0,
      redundant_value: 0,
      missing_required_count: 0,
      datatype_error_count: 0,
      fixed_header_error_count: 0,
      date_format_error_count: 0,
      cell_start_with_end_with_error_count: 0,
      length_validation_error_count: 0,
      blocked_word_error_count: 0,
      error_msg: [],
    };
  }

  // 📌 Process rows
  for (let i = 0; i < jsonData.length; i++) {
    const rowData = jsonData[i];

    total_rows++;

    const rowNumber = i + 2; // similar to Excel row numbering

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
