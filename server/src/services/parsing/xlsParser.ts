import ExcelJS from "exceljs";
import fs from "fs";

import { convertXlsToXlsx } from "../../utils/convertXlsToXlsx";
import { xlsxParser } from "./xlsxParser";

import { ColumnRule } from "../../interface/importedFile.interface";

export const xlsParser = async (
  filePath: string,
  columnConfig: Record<string, ColumnRule>,
  errorSheet: ExcelJS.Worksheet,
) => {
  let xlsxPath: string | null = null;

  try {
    // STEP 1: convert xls → xlsx
    xlsxPath = convertXlsToXlsx(filePath);

    if (!xlsxPath || !fs.existsSync(xlsxPath)) {
      throw new Error("Failed to convert XLS file");
    }
    const stats = fs.statSync(xlsxPath);
    console.log("====================Converted XLSX size:", stats.size);

    // STEP 2: parse XLSX
    const result = await xlsxParser(xlsxPath, columnConfig, errorSheet);

    return result;
  } catch (err) {
    console.error("XLS parsing error:", err);

    throw new Error("XLS file is corrupted or cannot be processed");
  } finally {
    // STEP 3: cleanup temp file
    if (xlsxPath && fs.existsSync(xlsxPath)) {
      try {
        fs.unlinkSync(xlsxPath);
      } catch (cleanupError) {
        console.error("Failed to delete temp XLSX:", cleanupError);
      }
    }
  }
};
