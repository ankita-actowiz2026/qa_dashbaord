import XLSX from "xlsx";
import ExcelJS from "exceljs";

import { ColumnRule } from "../../interface/importedFile.interface";
import {
  validateRow,
  getCellValue,
  prepareColumnRules,
} from "../../validations/user.importedFile.validations";

export const parseXlsFile = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
  totalsSheet: ExcelJS.Worksheet,
  errorSheet: ExcelJS.Worksheet,
) => {
  const ruleMap: Record<string, ColumnRule> = columnConfig;

  prepareColumnRules(ruleMap);

  const duplicateTracker: Record<string, Set<any>> = {};

  Object.entries(columnConfig).forEach(([colName, col]) => {
    if (!col.is_allow_duplicate) {
      duplicateTracker[colName] = new Set();
    }
  });

  let total_rows = 0;
  let valid_rows = 0;
  let invalid_rows = 0;

  const columnStats: Record<string, any> = {};

  // Read workbook
  const workbook = XLSX.readFile(filePath, { cellDates: true });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert sheet to rows
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (!rows.length) {
    return {
      total_rows: 0,
      valid_rows: 0,
      invalid_rows: 0,
      column_wise_stats: {},
    };
  }

  const headers: string[] = rows[0].map((h) => String(getCellValue(h)).trim());

  // Initialize column stats
  headers.forEach((header) => {
    if (!header) return;

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

  // Process rows
  for (let i = 1; i < rows.length; i++) {
    total_rows++;

    const rowValues = rows[i];
    const rowNumber = i + 1;

    const rowData: any = {};

    for (let j = 0; j < headers.length; j++) {
      const columnName = headers[j];
      rowData[columnName] = getCellValue(rowValues?.[j]);
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
