import { Request, Response, NextFunction } from "express";
import path from "path";
import { xlsxParser } from "../services/parsing/xlsxParser";
import fs from "fs";
import ExcelJS from "exceljs";

import { ColumnRule } from "../interface/importedFile.interface";
import { csvParser } from "../services/parsing/csvParser";
import { xlsParser } from "../services/parsing/xlsParser";
import { jsonParser } from "../services/parsing/jsonParser";
/**
 * Add/Upload Imported File
 */
const generateFileName = (file_name = "data", extension = "json") => {
  const now = new Date();

  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const yyyy = now.getFullYear();

  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return `${file_name}_${mm}${dd}${yyyy}${hh}${mi}${ss}.${extension}`;
};
export const addImportedFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let filePath: string | null = null;

  //create csv file
  const errorFilePath = generateFileName("validation_result", "xlsx");
  const outputPath = path.join("validation_result", errorFilePath);
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    filename: outputPath,
    useStyles: true,
  });
  //first sheet
  const totalsSheet = workbook.addWorksheet("Totals");
  //second sheet
  const errorSheet = workbook.addWorksheet("Error messages");

  const errorHeaderRow = errorSheet.addRow([
    "Row",
    "Column",
    "ErrorType",
    "ErrorDescription",
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
    const columnConfig: Record<string, ColumnRule> = JSON.parse(
      req.body.columnConfig,
    );

    let result: {
      column_wise_stats: Record<string, any>;
    };
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
        throw new Error("Unsupported file type");
    }

    // //start storing in excel
    const column_wise_stats = result.column_wise_stats;
    const columns = Object.keys(column_wise_stats);

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

    await workbook.commit();
    //storing in excel end
    const publicUrl =
      `${process.env.API_URL}/` + outputPath.replace(/\\/g, "/");
    res.status(200).json({
      success: true,
      result_file: publicUrl,
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
