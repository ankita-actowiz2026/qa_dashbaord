import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import { ColumnRule, ParserResult } from "../interface/importedFile.interface";
import { errorMessageMap } from "../utils/importFileDefaultColumnStats";
import { csvParser } from "../services/parsing/csvParser";
import { xlsParser } from "../services/parsing/xlsParser";
import { jsonParser } from "../services/parsing/jsonParser";
import { xlsxParser } from "../services/parsing/xlsxParser";
/**
 * Add/Upload Imported File
 */
class ImportFileController {
  generateFileName = (file_name = "data", extension = "json") => {
    const now = new Date();

    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const yyyy = now.getFullYear();

    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    return `${file_name}_${mm}${dd}${yyyy}${hh}${mi}${ss}.${extension}`;
  };
  addImportedFile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    let filePath: string | null = null;

    //create csv file
    const errorFilePath = this.generateFileName("validation_result", "xlsx");
    const outputPath = path.join("validation_result", errorFilePath);
    await fs.promises.mkdir("validation_result", { recursive: true });
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: outputPath,
      useStyles: false,
    });
    //first sheet
    const totalsSheet = workbook.addWorksheet("Totals");
    //second sheet
    const errorSheet = workbook.addWorksheet("Error messages");

    const errorHeaderRow = errorSheet.addRow([
      this.cleanExcelString("Row"),
      this.cleanExcelString("Column"),
      this.cleanExcelString("ErrorType"),
      this.cleanExcelString("ErrorDescription"),
    ]);
    errorHeaderRow.font = { bold: true };
    errorHeaderRow.commit();
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
        return;
      }

      filePath = path.resolve(req.file.path);
      const ext = path.extname(filePath).toLowerCase();
      let columnConfig: Record<string, ColumnRule>;
      try {
        columnConfig = JSON.parse(req.body.columnConfig);
      } catch {
        throw new Error("Invalid columnConfig JSON");
      }

      let result: ParserResult;
      switch (ext) {
        case ".json":
          result = await jsonParser(filePath, columnConfig, errorSheet);
          break;
        case ".xls":
          result = await xlsParser(filePath, columnConfig, errorSheet);
          break;
        case ".csv":
          result = await csvParser(filePath, columnConfig, errorSheet);
          break;
        case ".xlsx":
          result = await xlsxParser(filePath, columnConfig, errorSheet);
          break;
        default:
          throw new Error(
            "Unsupported file type. Only .xlsx, .json, .csv, .xls files are allowed",
          );
      }

      //start storing in excel first sheet
      const column_wise_stats = result.column_wise_stats;
      const columns = Object.keys(column_wise_stats);

      if (!columns.length) {
        throw new Error("No column stats generated or File is empty");
      }
      const metrics = Object.keys(column_wise_stats[columns[0]]).filter(
        (m) => m !== "error_msg",
      );
      // Header Row
      const totalHeaderRow = totalsSheet.addRow(["", ...columns]);
      totalHeaderRow.font = { bold: true };
      totalHeaderRow.commit();

      // Loop metrics
      for (const metric of metrics) {
        const row = totalsSheet.addRow([
          metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          ...columns.map((c) => column_wise_stats[c][metric]),
        ]);
        // make metric name bold
        row.getCell(1).font = { bold: true };
        row.commit();
      }
      //end first sheet

      //show colom wise errors
      const errors_for_coloms: Record<string, string[]> = {};
      for (const column in result.column_wise_stats) {
        const stats = column_wise_stats[column];
        const errors: string[] = [];
        for (const key in errorMessageMap) {
          if (stats[key] && stats[key] > 0) {
            errors.push(errorMessageMap[key]);
          }
        }
        errors_for_coloms[column] = errors;
      }
      const colomwise_sheet = workbook.addWorksheet("Column errors");
      const colomwiseHeaderRow = colomwise_sheet.addRow(columns);
      colomwiseHeaderRow.font = { bold: true };
      colomwiseHeaderRow.commit();

      // Find max error length
      const lengths = Object.values(errors_for_coloms).map((arr) => arr.length);
      const maxRows = lengths.length ? Math.max(...lengths) : 0;

      // Add rows
      for (let i = 0; i < maxRows; i++) {
        const rowData = columns.map((col) =>
          this.cleanExcelString(errors_for_coloms[col][i] || ""),
        );
        const row = colomwise_sheet.addRow(rowData);
        row.commit();
      }

      //end added in sheet

      try {
        totalsSheet.commit();
        errorSheet.commit();
        colomwise_sheet.commit();
        await workbook.commit();
      } catch (err) {
        console.error("Excel write error:", err);
        throw err;
      }
      //storing in excel end
      const publicUrl = `${process.env.API_URL}/${outputPath.replace(/\\/g, "/")}`;
      res.status(200).json({
        success: true,
        result_file: publicUrl,
        data: result,
        errors_for_coloms: errors_for_coloms,
      });
    } catch (error) {
      next(error);
    } finally {
      //Delete uploaded file after processing
      if (filePath) {
        try {
          await fs.promises.unlink(filePath);
          console.log("Uploaded file deleted:", filePath);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }
    }
  };
  cleanExcelString = (value: any): string => {
    if (value === null || value === undefined) return "";

    return String(value).replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,
      "",
    );
  };
}
export const importFileController = new ImportFileController();
