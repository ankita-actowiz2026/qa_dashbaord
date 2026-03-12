import XLSX from "xlsx";
import path from "path";

export const convertXlsToXlsx = (xlsPath: string): string => {
  const workbook = XLSX.readFile(xlsPath);

  const xlsxPath = xlsPath.replace(/\.xls$/i, ".xlsx");

  XLSX.writeFile(workbook, xlsxPath);

  return xlsxPath;
};
