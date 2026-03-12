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
  // STEP 1: convert xls → xlsx
  const xlsxPath = convertXlsToXlsx(filePath);

  // STEP 2: use existing streaming parser
  const result = await xlsxParser(xlsxPath, columnConfig, errorSheet);

  // STEP 3: delete temporary xlsx
  if (fs.existsSync(xlsxPath)) {
    fs.unlinkSync(xlsxPath);
  }

  return result;
};
