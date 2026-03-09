import fs from "fs";
import ExcelJS from "exceljs";

import { ColumnRule } from "../interface/importedFile.interface";
import {
  validateRow,
  buildDateRegex,
} from "../validations/user.importedFile.validations";
const generateFileName = () => {
  const now = new Date();

  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const yyyy = now.getFullYear();

  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return `data_${mm}${dd}${yyyy}${hh}${mi}${ss}.ndjson`;
};

export const parseExcelFileStream = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
) => {
  const fileName = generateFileName();

  const getCellValue = (cell: any): string => {
    if (cell === null || cell === undefined) return "";

    if (typeof cell === "object") {
      if (cell.richText) {
        return cell.richText
          .map((t: any) => t.text)
          .join("")
          .trim();
      }

      if (cell.text) {
        return String(cell.text).trim();
      }

      if (cell.result) {
        return String(cell.result).trim();
      }
    }

    return String(cell).trim();
  };

  const ruleMap: Record<string, ColumnRule> = columnConfig;

  for (const rule of Object.values(ruleMap)) {
    if (rule.fixed_header?.length) {
      rule.fixed_header_set = new Set(
        rule.fixed_header.map((v: string) => v.trim().toLowerCase()),
      );
    }
  }

  for (const rule of Object.values(ruleMap)) {
    if (rule.cell_start_with?.length) {
      rule.cell_start_with_normalized = rule.cell_start_with.map((v) =>
        String(v).trim().toLowerCase(),
      );
    }
  }
  for (const rule of Object.values(ruleMap)) {
    if (rule.cell_end_with?.length) {
      rule.cell_end_with_normalized = rule.cell_end_with.map((v) =>
        String(v).trim().toLowerCase(),
      );
    }
  }

  for (const rule of Object.values(ruleMap)) {
    if (rule.not_match_found?.length) {
      rule.not_match_found_normalized = rule.not_match_found.map((w: string) =>
        w.trim().toLowerCase(),
      );
    }
  }
  for (const rule of Object.values(ruleMap)) {
    if (rule.data_redundant_threshold) {
      rule.redundantCounter = new Map<string, number>();
    }
  }

  for (const rule of Object.values(ruleMap)) {
    if (rule.data_type === "date" && rule.date_format) {
      rule.dateRegex = buildDateRegex(rule.date_format);
    }
  }
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
        headers = values.slice(1).map((h) => getCellValue(h));
        headerInitialized = true;
        headers.forEach((header) => {
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
    fileName,
  };
};
