import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

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
  createColumnStatsFromRules,
  extractDependencyColumns,
} from "../../validations/user.importedFile.validations";
//import { DBBuffer } from "../../utils/DBBuffer";

export const jsonParser = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
): Promise<ParserResult> => {
  const ruleMap = columnConfig;
  prepareColumnRules(ruleMap);

  let total_rows = 0;
  let valid_rows = 0;
  let invalid_rows = 0;

  let headers: string[] = [];
  let headerInitialized = false;

  const columnStats: Record<string, any> = {};
  // const fileNameForBuffer = path.basename(filePath);
  // const dbBuffer = new DBBuffer(fileNameForBuffer, 2000);
  let previewRows: any[] = [];
  let detectedHeaders = new Set<string>();

  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const jsonParserStream = parser();
    const arrayStream = streamArray();

    let isSettled = false;

    const safeReject = (err: Error) => {
      if (!isSettled) {
        isSettled = true;
        reject(err);
        fileStream.destroy();
        jsonParserStream.destroy();
        arrayStream.destroy();
      }
    };

    const safeResolve = (data: ParserResult) => {
      if (!isSettled) {
        isSettled = true;
        resolve(data);
      }
    };

    fileStream.on("error", () =>
      safeReject(new Error("JSON file could not be read")),
    );
    jsonParserStream.on("error", () => safeReject(new Error("Invalid JSON")));
    arrayStream.on("error", safeReject);

    fileStream.pipe(jsonParserStream).pipe(arrayStream);

    const processRow = (rowData: any) => {
      total_rows++;
      const rowNumber = total_rows;

      const formattedRow: any = {};

      headers.forEach((header) => {
        formattedRow[header] = rowData?.[header];
      });

      const rowValid = validateRow(
        formattedRow,
        rowNumber,
        headers,
        ruleMap,
        columnStats,
        //dbBuffer,
        "json",
      );

      if (rowValid) valid_rows++;
      else invalid_rows++;
    };

    const handleRowError = (err: any) => {
      invalid_rows++;

      // dbBuffer.add({
      //   rowNumber: total_rows + 1,
      //   columnName: "Row Error",
      //   errorType: "Row Processing Error",
      //   errorMsg: err?.message || "Unknown error",
      // });
    };

    arrayStream.on("data", ({ value }) => {
      try {
        const rowData = value;

        // ✅ Validate row type first
        if (typeof rowData !== "object" || rowData === null) {
          handleRowError(new Error("Invalid row format"));
          return;
        }

        // ✅ Collect first 50 rows
        if (previewRows.length < 50) {
          previewRows.push(rowData);

          Object.keys(rowData).forEach((key) => {
            detectedHeaders.add(key);
          });

          return;
        }

        // ✅ Initialize headers once
        if (!headerInitialized) {
          headers = Array.from(detectedHeaders);

          headers.forEach((header) => {
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
          headerInitialized = true;

          // Process buffered rows
          previewRows.forEach((row) => processRow(row));
          previewRows = [];
        }

        // ✅ Process current row
        processRow(rowData);
      } catch (err) {
        handleRowError(err);
      }
    });

    arrayStream.on("end", () => {
      try {
        if (!headerInitialized) {
          headers = Array.from(detectedHeaders);

          headers.forEach((header) => {
            const ruleConfig = columnConfig[header] || {};
            columnStats[header] = createColumnStatsFromRules(
              ruleConfig,
              "not_add_dependency",
            );
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
          previewRows.forEach((row) => processRow(row));
        }

        //dbBuffer.flush();

        safeResolve({
          total_rows,
          valid_rows,
          invalid_rows,
          column_wise_stats: columnStats,
        });
      } catch (err) {
        safeReject(err as Error);
      }
    });
  });
};
