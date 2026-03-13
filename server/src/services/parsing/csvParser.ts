import fs from "fs";
import ExcelJS from "exceljs";
import csv from "csv-parser";
import { ErrorBuffer } from "../../utils/errorBuffer";
import { createColumnStats } from "../../utils/importFileDefaultColumnStats";
import {
  ColumnRule,
  ParserResult,
} from "../../interface/importedFile.interface";
import {
  validateRow,
  getCellValue,
  prepareColumnRules,
} from "../../validations/user.importedFile.validations";

export const csvParser = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
  errorSheet: ExcelJS.Worksheet,
): Promise<ParserResult> => {
  const ruleMap: Record<string, ColumnRule> = columnConfig;

  prepareColumnRules(ruleMap);

  let headers: string[] = [];

  let total_rows = 0;
  let valid_rows = 0;
  let invalid_rows = 0;

  const columnStats: Record<string, any> = {};

  let headerInitialized = false;
  const errorBuffer = new ErrorBuffer(errorSheet, 500);

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
              columnStats[header] = createColumnStats();
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
            errorBuffer,
          );

          if (rowValid) valid_rows++;
          else invalid_rows++;
        } catch (rowError) {
          invalid_rows++;

          errorBuffer.add([
            total_rows + 1,
            "Row Error",
            "Parsing Error",
            (rowError as Error).message,
          ]);
        }
      });

      csvStream.on("end", () => {
        try {
          errorBuffer.flush();

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
