import ExcelJS from "exceljs";
import fs from "fs";
import { ErrorBuffer } from "../../utils/errorBuffer";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";
import { createColumnStats } from "../../utils/importFileDefaultColumnStats";
import {
  ColumnRule,
  ParserResult,
} from "../../interface/importedFile.interface";
import {
  validateRow,
  prepareColumnRules,
} from "../../validations/user.importedFile.validations";

export const jsonParser = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
  errorSheet: ExcelJS.Worksheet,
): Promise => {
  const ruleMap: Record<string, ColumnRule> = columnConfig;
  prepareColumnRules(ruleMap);

  let total_rows = 0;
  let valid_rows = 0;
  let invalid_rows = 0;

  let headers: string[] = [];
  let headerInitialized = false;

  const columnStats: Record<string, any> = {};
  const errorBuffer = new ErrorBuffer(errorSheet, 500);

  return new Promise((resolve, reject) => {
    try {
      const fileStream = fs.createReadStream(filePath);
      const jsonParser = parser();
      const arrayStream = streamArray();

      fileStream.pipe(jsonParser).pipe(arrayStream);

      // HANDLE STREAM ERRORS
      fileStream.on("error", reject);
      jsonParser.on("error", (err) => {
        reject(new Error("Invalid or corrupted JSON file"));
      });
      arrayStream.on("error", reject);

      arrayStream.on("data", ({ key, value }) => {
        try {
          const rowData = value;

          if (!headerInitialized) {
            headers = Object.keys(rowData);

            headers.forEach((header) => {
              columnStats[header] = createColumnStats();
            });

            headerInitialized = true;
          }

          total_rows++;
          const rowNumber = total_rows;

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

      arrayStream.on("end", () => {
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
