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
    const stream = fs.createReadStream(filePath).pipe(csv());

    stream.on("data", (row) => {
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
    });

    stream.on("end", () => {
      errorBuffer.flush();

      resolve({
        total_rows,
        valid_rows,
        invalid_rows,
        column_wise_stats: columnStats,
      });
    });

    stream.on("error", reject);
  });
};
