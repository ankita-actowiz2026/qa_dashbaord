import readline from "readline";
import { Request, Response, NextFunction, response } from "express";
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
import { validationResponse } from "../models/validationResponse.model";
import { errorLog } from "../models/errorLog";
import {
  validateRow,
  getCellValue,
  prepareColumnRules,
} from "../validations/user.importedFile.validations";
import { ValidationRule } from "../models/validationRule.model";

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

  runValidation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    let filePath: string | null = null;

    try {
      // ✅ 1. Validate input
      if (!req.body.fileName) {
        res.status(400).json({
          success: false,
          message: "No file provided",
        });
        return;
      }
      if (!req.body.originalFileName) {
        res.status(400).json({
          success: false,
          message: "No original name provided",
        });
        return;
      }

      filePath = path.resolve(req.body.fileName);
      const originalFileName = req.body.originalFileName;
      const fileName = path.basename(filePath).trim();

      console.log("Resolved path:", filePath);

      const ext = path.extname(filePath).toLowerCase();

      if (!req.body.columnConfig) {
        throw new Error("columnConfig is missing");
      }

      const columnConfig: Record<string, ColumnRule> =
        typeof req.body.columnConfig === "string"
          ? JSON.parse(req.body.columnConfig)
          : req.body.columnConfig;

      // =========================
      // ✅ 2. PARSE FILE
      // =========================

      let result: ParserResult;

      switch (ext) {
        case ".json":
          result = await jsonParser(filePath, columnConfig);
          break;
        case ".xls":
          result = await xlsParser(filePath, columnConfig);
          break;
        case ".csv":
          result = await csvParser(filePath, columnConfig);
          break;
        case ".xlsx":
          result = await xlsxParser(filePath, columnConfig);
          break;
        default:
          throw new Error(
            "Unsupported file type. Only .xlsx, .json, .csv, .xls allowed",
          );
      }
      const column_wise_stats = result.column_wise_stats;
      const columns = Object.keys(column_wise_stats);

      if (!columns.length) {
        throw new Error("No column stats generated or File is empty");
      }

      //       await validationResponse.create({
      //   fileName,
      //   column_wise_stats,
      // });

      delete result.column_wise_stats;
      const filteredColumnStats = Object.fromEntries(
        Object.entries(column_wise_stats).filter(([key, value]: any) => {
          return !(
            value.total_records === 0 &&
            value.valid_records === 0 &&
            value.invalid_records === 0 &&
            value.unique_records === 0
          );
        }),
      );
      let savedDoc;
      try {
        savedDoc = await validationResponse.create({
          feedName: "",
          originalFileName: originalFileName,
          accessFileName: fileName,
          response: filteredColumnStats,
          rules: req.body.columnConfig,
        });
      } catch (err) {
        throw new Error("File not saved in DB");
      }

      const insertedId = savedDoc._id;

      res.status(200).json({
        success: true,
        fileName,
        message: "File processed successfully",
        data: result,
        filteredColumnStats,
        insertedId,
      });
    } catch (error) {
      next(error);
    } finally {
      // Optional: delete uploaded file
      // if (filePath) await fs.promises.unlink(filePath);
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
        filePath: req.file.destination + "/" + req.file.filename,
      });
    } catch (error) {
      next(error);
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

  validationResponse = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "id is required",
        });
      }

      const data = await validationResponse.findById(id).lean(); // 🔥 faster

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "No data found for this file",
        });
      }

      return res.status(200).json({
        success: true,
        data: data?.response,
      });
    } catch (error) {
      console.error("validationResponse error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
  downloadFile = async (req: Request, res: Response) => {
    try {
      const { fileName } = req.params;

      if (!fileName) {
        return res.status(400).json({
          success: false,
          message: "fileName is required",
        });
      }

      const validattionResponse = await validationResponse
        .findOne({
          fileName,
        })
        .lean(); // 🔥 faster

      const newFileName = fileName.toLowerCase().endsWith(".xls")
        ? fileName.replace(/\.xls$/i, ".xlsx")
        : fileName;

      const errorLogData = await errorLog.findOne({
        fileName: newFileName,
      });

      const errorFilePath = this.generateFileName("validation_result", "xlsx");
      const outputPath = path.join("validation_result", errorFilePath);
      await fs.promises.mkdir("validation_result", { recursive: true });
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        filename: outputPath,
        useStyles: false,
      });
      /////////////////first sheet
      const totalsSheet = workbook.addWorksheet("Totals");
      const column_wise_stats = validattionResponse?.column_wise_stats;
      const columns = Object.keys(column_wise_stats);

      if (!columns.length) {
        throw new Error("No column stats generated or File is empty");
      }

      // 2. Ignore default keys
      const IGNORE_KEYS = [
        "total_records",
        "valid_records",
        "invalid_records",
        "unique_records",
        "error_msg",
      ];

      // 3. Filter columns with meaningful data
      const filteredColumns = columns.filter((col) => {
        const stats = column_wise_stats[col] || {};

        const total = Number(stats.total_records || 0);
        const valid = Number(stats.valid_records || 0);
        const invalid = Number(stats.invalid_records || 0);

        // ❌ Remove column if all 3 are 0
        if (total === 0 && valid === 0 && invalid === 0) {
          return false;
        }

        // ✅ Keep ONLY if at least one metric > 0
        const hasUsefulData = Object.entries(stats).some(([key, value]) => {
          if (IGNORE_KEYS.includes(key)) return false;

          const num = Number(value);

          return !isNaN(num) && num > 0; // 🔥 KEY FIX
        });

        return hasUsefulData;
      });

      // 👉 4. Use filteredColumns OR fallback to all columns
      const finalColumns = filteredColumns.length ? filteredColumns : columns;

      // 5. Metrics (based on available columns safely)

      const metricsSet = new Set();

      finalColumns.forEach((col) => {
        Object.keys(column_wise_stats[col] || {}).forEach((key) => {
          if (
            ![
              "error_msg",
              "error_rows",
              "invalid_row_numbers",
              "unique_values",
            ].includes(key)
          ) {
            metricsSet.add(key);
          }
        });
      });

      const metrics = Array.from(metricsSet);
      // 6. Header Row
      const totalHeaderRow = totalsSheet.addRow([
        "Validation Type",
        ...finalColumns,
      ]);

      totalHeaderRow.eachCell((cell) => {
        cell.font = { bold: true };
      });

      totalHeaderRow.commit();

      // 7. Loop metrics
      for (const metric of metrics) {
        const row = totalsSheet.addRow([
          metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),

          ...finalColumns.map((c) => {
            const val = column_wise_stats[c]?.[metric];

            if (val === null || val === undefined || Number.isNaN(val)) {
              return "N/A";
            }

            return val;
          }),
        ]);

        row.getCell(1).font = { bold: true };
        row.commit();
      }
      //////////////

      //errorLog.errors
      // const errorSheet = workbook.addWorksheet("Error messages");

      // const errorHeaderRow = errorSheet.addRow([
      //   this.cleanExcelString("Row"),
      //   this.cleanExcelString("Column"),
      //   this.cleanExcelString("ErrorType"),
      //   this.cleanExcelString("ErrorDescription"),
      // ]);

      // errorHeaderRow.font = { bold: true };
      // errorHeaderRow.commit();

      // // ✅ remove extension and add .json
      // const nameWithoutExt = path.parse(fileName).name;
      // const jsonFileName = `${nameWithoutExt}.json`;

      // // ✅ read JSON
      // const errors = await this.readErrorFile(jsonFileName);

      // let count = 0;
      // console.log("~~~~~~>" + jsonFileName);
      // for (const err of errors) {
      //   console.log("~~>" + err.rowNumber);
      //   const row = errorSheet.addRow([
      //     this.cleanExcelString(err.rowNumber ?? ""),
      //     this.cleanExcelString(err.columnName ?? ""),
      //     this.cleanExcelString(err.errorType ?? ""),
      //     this.cleanExcelString(err.errorMsg ?? ""),
      //   ]);

      //   row.commit();

      //   count++;

      //   // prevent blocking for large data
      //   if (count % 1000 === 0) {
      //     await new Promise((r) => setImmediate(r));
      //   }
      // }
      ////////////////second end

      //third
      const colom_error: Record<string, string[]> = {};

      for (const column in column_wise_stats) {
        const stats = column_wise_stats[column];
        const errors: string[] = [];

        for (const key in errorMessageMap) {
          if (stats[key] && stats[key] > 0) {
            errors.push(errorMessageMap[key]);
          }
        }

        if (errors.length > 0) {
          colom_error[column] = errors;
        }
      }

      console.log(colom_error);

      // ✅ Use only columns with errors
      const errorColumns = Object.keys(colom_error);

      const colomwise_sheet = workbook.addWorksheet("Column errors");

      // ✅ Header
      const colomwiseHeaderRow = colomwise_sheet.addRow(errorColumns);
      colomwiseHeaderRow.font = { bold: true };
      colomwiseHeaderRow.commit();

      // ✅ Handle no errors case
      if (!errorColumns.length) {
        colomwise_sheet.addRow(["No column errors found"]).commit();
      } else {
        const lengths = Object.values(colom_error).map((arr) => arr.length);
        const maxRows = Math.max(...lengths);

        for (let i = 0; i < maxRows; i++) {
          const rowData = errorColumns.map((col) =>
            this.cleanExcelString(colom_error[col][i] || ""),
          );

          const row = colomwise_sheet.addRow(rowData);
          row.commit();
        }
      }
      ////third end
      const publicUrl = `${process.env.API_URL}/${outputPath.replace(/\\/g, "/")}`;
      try {
        totalsSheet.commit();
        //  errorSheet.commit();
        colomwise_sheet.commit();
        await workbook.commit();
      } catch (err) {
        console.error("Excel write error:", err);
        throw err;
      }
      return res.status(200).json({
        success: true,
        result_file: publicUrl,
      });
    } catch (error) {
      console.error("validationResponse error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  async readErrorFile(fileName: string) {
    const filePath = path.resolve("error_logs", fileName);
    console.log("path==>" + filePath);
    if (!fs.existsSync(filePath)) {
      console.log("File not found:", filePath);
      return [];
    }

    try {
      const content = await fs.promises.readFile(filePath, "utf-8");

      const parsed = JSON.parse(content);
      console.log("PArsed-->");
      console.log(parsed);
      // safety check
      if (!Array.isArray(parsed)) {
        console.log("++++++++Invalid JSON format");
        return [];
      }

      return parsed;
    } catch (err) {
      console.error("++++++++++Error reading JSON:", err);
      return [];
    }
  }
}
export const importFileController = new ImportFileController();
