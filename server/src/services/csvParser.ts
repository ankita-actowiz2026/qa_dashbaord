import fs from "fs";
import readline from "readline";

import { ColumnRule } from "../interface/importedFile.interface";
import {
  validateRow,
  buildDateRegex,
  //generateFileName,
  getCellValue,
  prepareColumnRules,
} from "../validations/user.importedFile.validations";

export const parseCsvFile = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
) => {
  //const fileName = generateFileName();

  const ruleMap: Record<string, ColumnRule> = columnConfig;

  prepareColumnRules(ruleMap);

  const duplicateTracker: Record<string, Set<any>> = {};

  Object.entries(columnConfig).forEach(([colName, col]) => {
    if (!col.is_allow_duplicate) {
      duplicateTracker[colName] = new Set();
    }
  });

  let headers: string[] = [];
  let headerInitialized = false;

  let total_rows = 0;
  let valid_rows = 0;
  let invalid_rows = 0;

  const columnStats: Record<string, any> = {};

  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let rowNumber = 0;

  for await (const line of rl) {
    rowNumber++;

    const values = line.split(",").map((v) => String(v).trim());

    // HEADER
    if (!headerInitialized) {
      headers = values.map((h) => String(getCellValue(h)).trim());

      headerInitialized = true;

      headers.forEach((header) => {
        if (!header || typeof header !== "string") return;

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
      });

      continue;
    }

    total_rows++;

    const rowData: any = {};

    for (let i = 0; i < headers.length; i++) {
      const columnName = headers[i];
      const value = values[i] ?? "";
      rowData[columnName] = getCellValue(value);
    }

    const rowValid = validateRow(
      rowData,
      rowNumber,
      headers,
      ruleMap,
      columnStats,
      duplicateTracker,
    );

    if (rowValid) {
      valid_rows++;
    } else {
      invalid_rows++;
    }
  }

  return {
    total_rows,
    valid_rows,
    invalid_rows,
    column_wise_stats: columnStats,
    //fileName,
  };
};
