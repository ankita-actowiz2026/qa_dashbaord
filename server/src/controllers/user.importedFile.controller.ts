import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import { ColumnRule, ParserResult } from "../interface/importedFile.interface";
import { errorMessageMap } from "../utils/importFileDefaultColumnStats";
import { csvParser } from "../services/parsing/csvParser";
import { xlsParser } from "../services/parsing/xlsParser";
import { xlsxParser } from "../services/parsing/xlsxParser";
import { jsonParser } from "../services/parsing/jsonParser";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";
import csv from "csv-parser";
import { convertXlsToXlsx } from "../utils/convertXlsToXlsx";

import {
  validateRow,
  getCellValue,
  prepareColumnRules,
} from "../validations/user.importedFile.validations";

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

  readHeader = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    let filePath: string | null = null;

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

      let result: string[] = [];
      switch (ext) {
        case ".json":
          result = await this.jsonParserHeader(filePath);
          break;
        case ".xls":
          result = await this.xlsParserHeader(filePath);
          break;
        case ".csv":
          result = await this.csvParserHeader(filePath);
          break;
        case ".xlsx":
          result = await this.xlsxParserHeader(filePath);

          break;
        default:
          throw new Error(
            "Unsupported file type. Only .xlsx, .json, .csv, .xls files are allowed",
          );
      }

      //storing in excel end
      res.status(200).json({
        success: true,
        data: result,
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
  xlsxParserHeader = async (filePath: string): Promise<string[]> => {
    try {
      const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
        entries: "emit",
        sharedStrings: "cache",
        hyperlinks: "ignore",
      });
      let sheetFound = false;
      let result: string[];
      for await (const worksheet of workbook) {
        sheetFound = true;
        for await (const row of worksheet) {
          try {
            const values = row.values as any[];
            result = values
              .slice(1)
              .map((h) => getCellValue(h)?.toString().trim());
            // CHECK INVALID HEADER
            if (result.some((h) => h === "[object Object]")) {
              throw new Error(
                "Invalid header detected in XLSX file. Header contains object value.",
              );
            }
            result.forEach((header) => {
              if (!header || typeof header !== "string") return;
            });
            return result;
          } catch (error) {
            throw error;
          }
        }
        break;
      }

      throw new Error("No valid header row found in XLSX file");
    } catch (error) {
      console.error("XLSX parsing error:", error);
      throw new Error("Invalid or corrupted XLSX file");
    }
  };
  csvParserHeader = async (filePath: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);
      const csvStream = csv();

      fileStream
        .pipe(csvStream)
        .once("headers", (headers: string[]) => {
          // ✅ stop reading immediately after headers
          fileStream.destroy();
          csvStream.destroy();

          resolve(headers);
        })
        .once("error", reject);

      fileStream.once("error", reject);
    });
  };

  jsonParserHeader = (filePath: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);

      const pipeline = fileStream.pipe(parser()).pipe(streamArray()); // ✅ direct array

      let headersSet = new Set<string>();
      let count = 0;
      const LIMIT = 50;
      let resolved = false;

      pipeline
        .on("data", ({ value }) => {
          // 🔍 DEBUG (optional)
          console.log("ROW:", value);

          if (value && typeof value === "object") {
            Object.keys(value).forEach((key) => headersSet.add(key));
            count++;
          }

          // ✅ stop early
          if (count >= LIMIT && !resolved) {
            resolved = true;
            cleanup();
            resolve(Array.from(headersSet));
          }
        })
        .on("end", () => {
          if (!resolved) {
            resolve(Array.from(headersSet));
          }
        })
        .on("error", reject);

      fileStream.on("error", reject);

      function cleanup() {
        fileStream.destroy();
        pipeline.destroy();
      }
    });
  };
  xlsParserHeader = async (filePath: string): Promise<string[]> => {
    let xlsxPath: string | null = null;

    try {
      xlsxPath = convertXlsToXlsx(filePath);

      if (!xlsxPath || !fs.existsSync(xlsxPath)) {
        throw new Error("Failed to convert XLS file");
      }
      const stats = fs.statSync(xlsxPath);
      console.log("====================Converted XLSX size:", stats.size);

      // STEP 2: parse XLSX
      const result = await this.xlsxParserHeader(xlsxPath);

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
}
export const importFileController = new ImportFileController();
