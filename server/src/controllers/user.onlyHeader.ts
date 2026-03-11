import { Request, Response } from "express";
import ExcelJS from "exceljs";
import fs from "fs";

import { ColumnRule } from "../interface/importedFile.interface";
import {
  validateRow,
  getCellValue,
  prepareColumnRules,
} from "../validations/user.importedFile.validations";

const normalizeHeader = (value: any) => {
  if (!value) return "";

  if (typeof value === "object") {
    if (value.text) return value.text;
    if (value.richText) {
      return value.richText.map((t: any) => t.text).join("");
    }
    if (value.sharedString !== undefined) {
      return String(value.sharedString);
    }
  }

  return String(value).trim();
};

export const readHeaders = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
  totalsSheet: ExcelJS.Worksheet,
  errorSheet: ExcelJS.Worksheet,
) => {
  try {
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
    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath);

    let header_read = 0;
    for await (const worksheet of workbook) {
      for await (const row of worksheet) {
        if (header_read == 0) {
          headers = row.values.slice(1).map((h: any) => normalizeHeader(h));
          //columnStats = headers;
          headers.forEach((header) => {
            if (!header || typeof header !== "string") return;
            columnStats[header] = {
              total_records11: 0,
              valid_records: 0,
              invalid_records: 0,
              redundant_value: 0,
              missing_required_count: 0,
              datatype_error_count: 0,
              pattern_error_count: 0,
              fixed_header_error_count: 0,
              date_format_error_count: 0,
              cell_start_with_end_with_error_count: 0,
              length_validation_error_count: 0,
              blocked_word_error_count: 0,
              error_msg: [],
            };
          });
          header_read = 1;
        } else {
          total_rows++;
          const rowNumber = row.number;
          const rowData: any = {};
          const headerLength = headers.length;
          const values = row.values as any[];
          for (let i = 1; i <= headerLength; i++) {
            const columnName = headers[i - 1];
            const value = values[i];
            rowData[columnName] = getCellValue(value);
          }
          const rowValid = 1;
          // const rowValid = validateRow(
          //   rowData,
          //   rowNumber,
          //   headers,
          //   ruleMap,
          //   columnStats,
          //   duplicateTracker,
          //   totalsSheet,
          //   errorSheet,
          // );
          if (rowValid) {
            valid_rows++;
            //clear_data.push(rowData);
          } else {
            invalid_rows++;
          }
        }
      }
      break; // stop after first sheet
    }
    return {
      total_rows,
      valid_rows,
      invalid_rows,
      column_wise_stats: columnStats,
    };
    // return {
    //   columnStats,
    //   //  data: headers,
    //   total_rows,
    // };
  } catch (error: any) {
    return;
  }
};
