import fs from "fs";
import ExcelJS from "exceljs";

import { ColumnRule } from "../interface/importedFile.interface";
import {
  validateRow,
  buildDateRegex,
  //  generateFileName,
  getCellValue,
  prepareColumnRules,
} from "../validations/user.importedFile.validations";

export const parseExcelFile = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
  totalsSheet: ExcelJS.Worksheet,
  errorSheet: ExcelJS.Worksheet,
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

  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    entries: "emit",
    sharedStrings: "cache",
    hyperlinks: "ignore",
  });

  for await (const worksheet of workbook) {
    for await (const row of worksheet) {
      const values = row.values as any[];
      // HEADER
      if (!headerInitialized) {
        headers = values.slice(1).map((h) => String(getCellValue(h)).trim());
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
      const rowNumber = row.number;
      const rowData: any = {};
      for (let i = 1; i <= headers.length; i++) {
        const columnName = headers[i - 1];
        const value = values[i];
        rowData[columnName] = getCellValue(value);
      }

      const rowValid = validateRow(
        rowData,
        rowNumber,
        headers,
        ruleMap,
        columnStats,
        duplicateTracker,
        totalsSheet,
        errorSheet,
      );

      if (rowValid) {
        valid_rows++;

        //clear_data.push(rowData);
      } else {
        invalid_rows++;
      }
    }

    break;
  }

  return {
    total_rows,
    valid_rows,
    invalid_rows,
    column_wise_stats: columnStats,
    //fileName,
  };
};
