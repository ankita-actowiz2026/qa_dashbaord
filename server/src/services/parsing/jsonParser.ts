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
): Promise<ParserResult> => {
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
    const pipeline = fs
      .createReadStream(filePath)
      .pipe(parser())
      .pipe(streamArray());

    pipeline.on("data", ({ key, value }) => {
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
    });

    pipeline.on("end", () => {
      errorBuffer.flush();
      resolve({
        total_rows,
        valid_rows,
        invalid_rows,
        column_wise_stats: columnStats,
      });
    });

    pipeline.on("error", reject);
  });
};
