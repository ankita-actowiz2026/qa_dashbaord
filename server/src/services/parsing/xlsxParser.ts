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
  createColumnStatsFromRules,
} from "../../validations/user.importedFile.validations";
const extractDependencyColumns = (columnConfig: Record<string, any>) => {
  const dependencyCols = new Set<string>();

  Object.values(columnConfig).forEach((col: any) => {
    const dependency = col?.dependency;
    if (!dependency) return;

    const mainColumn = col.name?.trim(); // ✅ normalize

    Object.keys(dependency).forEach((key) => {
      // ❌ skip main column safely
      if (key.trim() === mainColumn) return;

      // ✅ split and add sub dependency columns
      key.split(",").forEach((k) => {
        const trimmed = k.trim();

        // ❌ skip if accidentally same as main column
        if (trimmed === mainColumn) return;

        if (trimmed) dependencyCols.add(trimmed);
      });
    });
  });

  return Array.from(dependencyCols);
};
export const xlsxParser = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
  errorSheet: ExcelJS.Worksheet,
) => {
  const ruleMap: Record<string, ColumnRule> = columnConfig;
  prepareColumnRules(ruleMap);

  let headers: string[] = [];
  let isHeaderRow = false;

  let total_rows = 0;
  let valid_rows = 0;
  let invalid_rows = 0;

  const columnStats: Record<string, ColumnStats> = {};
  const errorBuffer = new ErrorBuffer(errorSheet, 500);

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
              console.log("+++++++++++++++");
              console.log(ruleConfig);
              console.log("+++++++++++++++");
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
            errorBuffer,
            "xlsx",
          );

          if (rowValid) {
            valid_rows++; //clear_data.push(rowData);
          } else {
            invalid_rows++;
          }
        } catch (rowError) {
          invalid_rows++;

          errorBuffer.add([
            row.number,
            "Row Error",
            "Row Processing Error",
            (rowError as Error).message,
          ]);
        }
      }

      break; // only first sheet
    }

    if (!sheetFound) {
      throw new Error("XLSX file contains no worksheets");
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

    throw new Error("Invalid or corrupted XLSX file");
  }
};
