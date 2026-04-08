import fs from "fs";
import ExcelJS from "exceljs";
import csv from "csv-parser";
import path from "path";
import { DBBuffer } from "../../utils/DBBuffer";
import { createColumnStats } from "../../utils/importFileDefaultColumnStats";
import {
  ColumnRule,
  ParserResult,
} from "../../interface/importedFile.interface";
import {
  validateRow,
  getCellValue,
  prepareColumnRules,
  createColumnStatsFromRules,
  extractDependencyColumns,
} from "../../validations/user.importedFile.validations";

export const csvParser = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
): Promise<ParserResult> => {
  const ruleMap: Record<string, ColumnRule> = columnConfig;

  prepareColumnRules(ruleMap);

  let headers: string[] = [];

  let total_rows = 0;
  let valid_rows = 0;
  let invalid_rows = 0;

  const columnStats: Record<string, any> = {};

  let headerInitialized = false;
  const fileNameForBuffer = path.basename(filePath);
  const dbBuffer = new DBBuffer(fileNameForBuffer, 2000);

  return new Promise((resolve, reject) => {
    try {
      const fileStream = fs.createReadStream(filePath);
      const csvStream = csv();

      fileStream.pipe(csvStream);

      // STREAM ERROR HANDLING
      fileStream.on("error", () => {
        reject(new Error("CSV file could not be read"));
      });

      csvStream.on("error", () => {
        reject(new Error("CSV file is corrupted or invalid"));
      });

      csvStream.on("data", (row) => {
        try {
          if (!headerInitialized) {
            headers = Object.keys(row);

            headers.forEach((header) => {
              const ruleConfig = columnConfig[header] || {};
              const stats = createColumnStatsFromRules(ruleConfig);
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
            headerInitialized = true;
          }

          total_rows++;
          const rowNumber = total_rows + 1;

          const rowData: any = {};

          headers.forEach((header) => {
            rowData[header] = getCellValue(row[header]);
          });

          const rowValid = validateRow(
            rowData,
            rowNumber,
            headers,
            ruleMap,
            columnStats,
            dbBuffer,
            "csv",
          );

          if (rowValid) valid_rows++;
          else invalid_rows++;
        } catch (rowError) {
          invalid_rows++;

          dbBuffer.add({
            rowNumber: total_rows + 1,
            columnName: "Row Error",
            errorType: "Row Processing Error",
            errorMsg: (rowError as Error).message,
          });
        }
      });

      csvStream.on("end", () => {
        try {
          dbBuffer.flush();

          resolve({
            total_rows,
            valid_rows,
            invalid_rows,
            column_wise_stats: columnStats,
          });
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};
