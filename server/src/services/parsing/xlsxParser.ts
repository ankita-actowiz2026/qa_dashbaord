import ExcelJS from "exceljs";
import { ErrorBuffer } from "../../utils/errorBuffer";
import {
  ColumnRule,
  ColumnStats,
} from "../../interface/importedFile.interface";
import {
  validateRow,
  getCellValue,
  prepareColumnRules,
} from "../../validations/user.importedFile.validations";
import { createColumnStats } from "../../utils/importFileDefaultColumnStats";

export const xlsxParser = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
  errorSheet: ExcelJS.Worksheet,
) => {
  try {
    const ruleMap: Record<string, ColumnRule> = columnConfig;

    prepareColumnRules(ruleMap);

    let headers: string[] = [];
    let isHeaderRow = false;

    let total_rows = 0;
    let valid_rows = 0;
    let invalid_rows = 0;

    const columnStats: Record<string, ColumnStats> = {};

    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
      entries: "emit",
      sharedStrings: "cache",
      hyperlinks: "ignore",
    });

    const errorBuffer = new ErrorBuffer(errorSheet, 500);
    for await (const worksheet of workbook) {
      for await (const row of worksheet) {
        const values = row.values as any[];
        // HEADER
        if (!isHeaderRow) {
          headers = values
            .slice(1)
            .map((h) => getCellValue(h)?.toString().trim());

          isHeaderRow = true;
          headers.forEach((header) => {
            if (!header || typeof header !== "string") return;
            columnStats[header] = createColumnStats();
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
          rowData[columnName] = getCellValue(value);
        }

        const rowValid = validateRow(
          rowData,
          rowNumber,
          headers,
          ruleMap,
          columnStats,
          errorBuffer,
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
    errorBuffer.flush();
    return {
      total_rows,
      valid_rows,
      invalid_rows,
      column_wise_stats: columnStats,
    };
  } catch (error) {
    console.error("XLSX parsing error:", error);

    throw new Error("Failed to parse XLSX file");
  }
};
