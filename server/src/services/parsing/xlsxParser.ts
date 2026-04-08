import ExcelJS from "exceljs";

import { DBBuffer } from "../../utils/DBBuffer";
import path from "path";

import {
  ColumnRule,
  ColumnStats,
  error_rows,
} from "../../interface/importedFile.interface";
import {
  validateRow,
  getCellValue,
  prepareColumnRules,
  createColumnStatsFromRules,
  extractDependencyColumns,
} from "../../validations/user.importedFile.validations";

export const xlsxParser = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
) => {
  const ruleMap: Record<string, ColumnRule> = columnConfig;
  prepareColumnRules(ruleMap);

  let headers: string[] = [];
  let isHeaderRow = false;

  let total_rows = 0;
  let valid_rows = 0;
  let invalid_rows = 0;

  const columnStats: Record<string, ColumnStats> = {};
  //const errorBuffer = new ErrorBuffer(errorSheet, 500);
  const fileNameForBuffer = path.basename(filePath);
  const dbBuffer = new DBBuffer(fileNameForBuffer, 2000);

  try {
    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
      entries: "emit",
      sharedStrings: "cache",
      hyperlinks: "ignore",
    });

    let sheetFound = false;

    for await (const worksheet of workbook) {
      sheetFound = true;

      for await (const row of worksheet) {
        try {
          const values = row.values as any[];

          // HEADER
          if (!isHeaderRow) {
            headers = values
              .slice(1)
              .map((h) => getCellValue(h, "string")?.toString().trim());
            // CHECK INVALID HEADER
            if (headers.some((h) => h === "[object Object]")) {
              throw new Error(
                "Invalid header detected in XLSX file. Header contains object value.",
              );
            }
            isHeaderRow = true;

            headers.forEach((header) => {
              if (!header || typeof header !== "string") return;

              const ruleConfig = columnConfig[header] || {};

              const stats = createColumnStatsFromRules(
                ruleConfig,
                "not_add_dependency",
              );

              // ✅ initialize Set here
              stats.unique_values = new Set();
              stats.invalid_row_numbers = [];
              columnStats[header] = stats;
            });
            const dependencyColumns = extractDependencyColumns(columnConfig);

            dependencyColumns.forEach((col) => {
              columnStats[col] ??= createColumnStatsFromRules(
                {
                  dependency: true,
                },
                "add_dependency",
              );
              columnStats[col].dependancy_error_count ??= 0;
            });
            continue;
          }

          total_rows++;

          const rowNumber = row.number;
          const rowData: Record<string, any> = {};
          const headerLength = headers.length;

          for (let i = 1; i <= headerLength; i++) {
            const columnName = headers[i - 1];
            const value = values[i];

            const rule = ruleMap[columnName]; // ✅ get rule

            //rowData[columnName] = getCellValue(value, rule?.data_type); // ✅ FIX
            rowData[columnName] = value; // ✅ FIX
          }

          const rowValid = validateRow(
            rowData,
            rowNumber,
            headers,
            ruleMap,
            columnStats,
            dbBuffer,
            "xlsx",
          );

          if (rowValid) {
            valid_rows++; //clear_data.push(rowData);
          } else {
            invalid_rows++;
          }
        } catch (rowError) {
          invalid_rows++;

          dbBuffer.add({
            rowNumber: row.number,
            columnName: "Row Error",
            errorType: "Row Processing Error",
            errorMsg: (rowError as Error).message,
          });
        }
      }

      break; // only first sheet
    }

    if (!sheetFound) {
      throw new Error("XLSX file contains no worksheets");
    }

    dbBuffer.flush();

    return {
      total_rows,
      valid_rows,
      invalid_rows,
      column_wise_stats: columnStats,
    };
  } catch (error) {
    console.error("XLSX parsing error:", error);

    throw new Error("Invalid or corrupted XLSX file");
  }
};
